# Infrastructure & Architecture

## System Overview

DocFlow is an **event-driven document processing pipeline**. Users upload documents through a REST API, and background workers process them asynchronously using a reliable message queue. The system handles PDF text extraction, image OCR, and graceful failure recovery.

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    CLIENT                           │
                    │              (Browser / curl / Postman)             │
                    └────────────────────────┬────────────────────────────┘
                                             │ POST /documents
                                             │ (multipart file upload)
                                             ▼
┌──────────────┐              ┌──────────────────────────┐    ┌─────────────────┐
│   DATABASE   │◄─────────────│         API              │───►│     S3 /        │
│  (Postgres)  │  1. INSERT   │      (Fastify)           │   │   Floci (local) │
│              │   document +  │   :3000                  │   │                 │
│              │   outbox     │                          │   │  Store uploaded │
│              │   event      │   GET /documents/:id     │   │  file           │
│              │              │   GET /health            │   │                 │
│              │              │   GET /ready             │   │                 │
│              │              │   GET /docs (Swagger UI) │   │                 │
│              │              │   /api/* (rate-limited)  │   │                 │
└──────┬───────┘              └──────────────────────────┘    └─────────────────┘
       │
       │ 2. SELECT PENDING
       │    FOR UPDATE SKIP LOCKED
       │
       ▼
┌──────────────────┐         ┌──────────────────────────┐   ┌──────────────────┐
│  OUTBOX WORKER   │────────►│        SQS               │   │  SQS DLQ         │
│                  │  3.     │   Main Queue             │   │                  │
│  Polls DB every  │  publish│                          │◄──│  (after 3 retries)│
│  5 seconds       │  event  │                          │   │                  │
│                  │         │                          │   │                  │
└──────────────────┘         └──────────┬───────────────┘   └──────────────────┘
                                        │ 4. receive
                                        │    message
                                        ▼
                              ┌───────────────────┐
                              │     WORKER        │
                              │                   │
                              │  • Claim document │
                              │  • Download from  │
                              │    S3             │
                              │  • PDF extract    │
                              │  • OCR (Tesseract)│
                              │  • Update DB      │
                              │    status         │
                              └───────────────────┘
```

## Data Flow — Step by Step

### 1. Upload (`API`)

```
Client ──POST /documents (file)──► API
                                    │
                                    ├─► Save file to S3
                                    ├─► INSERT documents (status = "UPLOADED")
                                    ├─► INSERT outbox_events (status = "PENDING")
                                    │    (same DB transaction)
                                    └─► Return 201 { id, filename, status }
```

The **transactional outbox pattern** ensures that if the DB write succeeds, the event is guaranteed to exist. The outbox worker picks it up later, so no message is ever lost even if the network to SQS is down.

### 2. Outbox Publish (`outbox-worker`)

```
Outbox Worker
  │
  ├─► SELECT * FROM outbox_events
  │       WHERE status = 'PENDING'
  │       LIMIT 10
  │       FOR UPDATE SKIP LOCKED
  │
  ├─► Validate event schema (Zod)
  ├─► SendMessage to SQS
  └─► UPDATE outbox_events SET status = 'SENT'
```

`FOR UPDATE SKIP LOCKED` prevents multiple outbox worker instances from processing the same event. Failed sends are retried on the next poll cycle (5s interval).

### 3. Document Processing (`worker`)

```
Worker
  │
  ├─► ReceiveMessage from SQS (long polling, 10s wait)
  ├─► Parse & validate message (Zod schema)
  ├─► claimDocument(id) — optimistic lock in DB:
  │       UPDATE documents SET status = 'PROCESSING'
  │       WHERE id = ? AND (status = 'UPLOADED' OR (status = 'PROCESSING' AND processed_at < 10min ago))
  │
  ├─► Get file from S3
  ├─► Route by content type:
  │     • application/pdf  → pdf-parse (text extraction)
  │     • image/png        → Tesseract.js (OCR)
  │     • other            → pass through
  │
  ├─► UPDATE documents SET status = 'PROCESSED', extracted_text = ...
  ├─► DeleteMessage from SQS
  │
  └─► On error:
        UPDATE documents SET status = 'FAILED', last_error = ...
        (message retries via SQS → eventually lands in DLQ)
```

### 4. Dead Letter Queue

Messages that fail 3 times are automatically moved by SQS to the DLQ. The worker also polls the DLQ and marks those documents as `FAILED` in the database so they don't sit in limbo.

## Component Details

### API (`apps/api`)

| Aspect            | Detail                                                    |
| ----------------- | --------------------------------------------------------- |
| Framework         | Fastify 5                                                 |
| Port              | 3000 (configurable via `PORT` env)                       |
| Endpoints         | `GET /health`, `GET /ready`, `GET /documents/:id`, `POST /documents`, `GET /docs` |
| File Upload       | `@fastify/multipart` with size limit (`MAX_FILE_SIZE`)   |
| Content Types     | PDF, PNG, JPEG, TIFF, plain text only                    |
| ID Validation     | UUID format enforced on `:id` route params               |
| Request Tracing   | `X-Request-ID` header — auto-generated if not provided   |
| Error Handling    | Structured JSON errors with descriptive messages         |
| Security Headers  | Helmet — automatic `X-Frame-Options`, `X-Content-Type-Options`, etc. |
| CORS              | Configurable origin allowlist via `CORS_ORIGINS`         |
| Rate Limiting     | 100 requests per 15s window, IP-based                    |
| API Documentation | OpenAPI/Swagger auto-generated, served at `/docs`        |
| Health Probes     | Liveness (`/health`) + readiness (`/ready` with DB check) |
| Shutdown          | Graceful — drains requests, closes DB                    |

### Worker (`apps/worker`)

| Aspect        | Detail                                    |
| ------------- | ----------------------------------------- |
| Pattern       | Polling loop with long-poll SQS receive   |
| Port          | 3002 (health server, Docker only)         |
| Concurrency   | Single-threaded (safe for local dev)      |
| Claim Lock    | DB-level optimistic lock with 10min timeout |
| OCR           | Tesseract.js (worker reused across images)|
| PDF           | `pdf-parse` library                       |
| Health        | Liveness (`/health`) + readiness (`/ready` with DB check) |
| CPU Backoff   | 1s sleep when queue is empty (prevents spin on local Floci) |
| Shutdown      | Graceful — stops polling, terminates OCR, closes DB, stops health server |

### Outbox Worker (`apps/outbox-worker`)

| Aspect        | Detail                                    |
| ------------- | ----------------------------------------- |
| Pattern       | Polling loop (5s interval)                |
| Port          | 3001 (health server, Docker only)         |
| Concurrency   | `FOR UPDATE SKIP LOCKED` for safety       |
| Batch Size    | 10 events per cycle                       |
| Health        | Liveness (`/health`) + readiness (`/ready` with DB check) |
| Retry         | Failed publishes retry on next cycle      |
| Shutdown      | Graceful — stops publishing, closes DB, stops health server |

### Database (`packages/database`)

| Table          | Purpose                                      |
| -------------- | -------------------------------------------- |
| `documents`    | Document metadata, status, extracted text    |
| `outbox_events`| Transactional outbox for reliable messaging  |

ORM: **Drizzle** with PostgreSQL. Schema-first with TypeScript types.

### Message Queue (`packages/aws`)

| Queue                        | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `docflow-document-processing`| Main processing queue                    |
| `docflow-document-processing-dlq` | Dead Letter Queue (after 3 failures) |

AWS SDK v3. Configured to point at Floci (local) or real AWS.

### Shared Packages

| Package         | Purpose                                    |
| --------------- | ------------------------------------------ |
| `@docflow/config`| Zod-validated environment variables       |
| `@docflow/logger`| Pino structured logging (pretty in dev)   |
| `@docflow/events`| Event type definitions + Zod schemas      |
| `@docflow/aws`   | Pre-configured AWS SDK clients (S3, SQS)  |

## Local Development Stack

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose                            │
│                                                                │
│  ┌────────────────┐      ┌────────────────┐                  │
│  │   PostgreSQL   │      │     Floci      │                  │
│  │    :5432       │      │    :4566       │                  │
│  │                │      │  (SQS, S3, STS)│                  │
│  └────────────────┘      └────────────────┘                  │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                     Host Machine                               │
│                                                                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │   API    │  │   Worker     │  │  Outbox Worker   │       │
│  │  :3000   │  │  (tsx)       │  │  (tsx)           │       │
│  └──────────┘  └──────────────┘  └──────────────────┘       │
│                                                                │
│  All managed by: pnpm run dev (Turborepo)                    │
└──────────────────────────────────────────────────────────────┘
```

### Services

| Service       | Image / Tool    | Port  | Purpose                              |
| ------------- | --------------- | ----- | ------------------------------------ |
| PostgreSQL    | `postgres:16`   | 5432  | Database for documents + outbox      |
| Floci         | `floci/floci:2` | 4566  | AWS emulator (SQS, S3, STS)          |
| API           | Node + tsx      | 3000  | Fastify REST API                     |
| Worker        | Node + tsx      | 3002  | SQS consumer, document processing    |
| Outbox Worker | Node + tsx      | 3001  | DB → SQS publisher                   |

## Infrastructure as Code (Terraform)

Terraform provisions the AWS resources against Floci locally:

```
terraform/
├── provider.tf   # AWS provider → Floci endpoints
├── variables.tf  # Configurable bucket name
└── main.tf       # S3 bucket + SQS queue + DLQ
```

| Resource                          | Terraform Name                    |
| --------------------------------- | --------------------------------- |
| S3 Bucket                         | `aws_s3_bucket.uploads`           |
| SQS Queue (main)                  | `aws_sqs_queue.document_processing`|
| SQS Queue (DLQ)                   | `aws_sqs_queue.document_processing_dlq` |

The main queue has a **redrive policy** pointing to the DLQ with `maxReceiveCount = 3`.

## Key Architectural Patterns

### Transactional Outbox

The most important pattern in this system. When a document is uploaded:

1. The document row and the outbox event row are inserted in **one database transaction**
2. The API returns immediately — no synchronous call to SQS
3. The outbox worker reliably publishes events from the database to SQS
4. If the worker crashes mid-publish, the event stays `PENDING` and is retried

This guarantees **at-least-once delivery** without risking data loss.

### Optimistic Claim Lock

The worker uses a single `UPDATE ... WHERE status = 'UPLOADED'` query to claim a document. Because PostgreSQL serializes writes, only one worker instance can ever succeed — no race conditions, no distributed locks needed.

### Dead Letter Queue

SQS automatically moves messages that fail 3 times to the DLQ. The worker monitors the DLQ and marks those documents as `FAILED` in the database, ensuring no document is silently lost.

## Environment Variables

| Variable                | Required | Default                    | Used By          |
| ----------------------- | -------- | -------------------------- | ---------------- |
| `DATABASE_URL`          | Yes      | —                          | API, Worker, Outbox |
| `S3_BUCKET`             | Yes      | —                          | API, Worker      |
| `SQS_QUEUE_URL`         | Yes      | —                          | Worker, Outbox   |
| `AWS_REGION`            | No       | `us-east-1`                | All AWS clients  |
| `AWS_ENDPOINT`          | No       | — (real AWS)               | All AWS clients  |
| `AWS_ACCESS_KEY_ID`     | No       | `test`                     | All AWS clients  |
| `AWS_SECRET_ACCESS_KEY` | No       | `test`                     | All AWS clients  |
| `PORT`                  | No       | `3000`                     | API              |
| `MAX_FILE_SIZE`         | No       | `10485760` (10 MB)        | API              |
| `CORS_ORIGINS`          | No       | `*` (all origins)          | API              |
| `RATE_LIMIT_MAX`        | No       | `100`                      | API              |
| `RATE_LIMIT_WINDOW`     | No       | `15 seconds`               | API              |
| `LOG_LEVEL`             | No       | `info`                     | Logger           |

## Deployment Targets

| Environment | Database     | Queue/Storage | Compute         |
| ----------- | ------------ | ------------- | --------------- |
| **Local**   | PostgreSQL   | Floci         | tsx (Node)      |
| **Docker**  | PostgreSQL   | Floci         | Multi-stage containers |
| **AWS**     | RDS / Aurora | SQS + S3      | ECS / Lambda    |

The code is environment-agnostic — swap `.env` values and the same codebase deploys to real AWS.

## Container Deployment

Each service has its own **multi-stage Dockerfile** for production-grade container images:

| Service         | Dockerfile Location                    |
| --------------- | -------------------------------------- |
| API             | `apps/api/Dockerfile`                  |
| Worker          | `apps/worker/Dockerfile`               |
| Outbox Worker   | `apps/outbox-worker/Dockerfile`        |

Each Dockerfile uses a **two-stage build**:
1. **Build stage** — Full Node 22 Alpine image with all dependencies installed via pnpm
2. **Production stage** — Minimal runtime image with only production dependencies + `tsx` for TypeScript execution

A shared `.dockerignore` at the repo root excludes `node_modules`, `.git`, IDE files, Terraform state, and documentation from the build context — keeping images lean.

```bash
# Build all images
docker compose build

# Run with Docker Compose (uses docker-compose.yml + Dockerfiles)
docker compose up
```

Each service Dockerfile includes a **HEALTHCHECK** instruction, enabling orchestrators (Docker Swarm, Kubernetes, ECS) to manage container lifecycle automatically:

| Service         | Health Port | Probe                                    |
| --------------- | ----------- | ---------------------------------------- |
| API             | 3000        | `GET /health` (Fastify liveness)         |
| Outbox Worker   | 3001        | `GET /health` (lightweight HTTP server)  |
| Worker          | 3002        | `GET /health` (lightweight HTTP server)  |

All three services also expose a **readiness probe** at `GET /ready`, which verifies database connectivity before accepting traffic.

## Best Practices & Hardening

### Security
- **Helmet** — Automatic security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-DNS-Prefetch-Control`, `X-Download-Options`, `X-Permitted-Cross-Domain-Policies`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`, `Content-Security-Policy`
- **CORS** — Configurable origin allowlist via `CORS_ORIGINS`. Set to specific domains in production; `*` is safe for local development
- **Rate limiting** — IP-based rate limiting (100 requests per 15-second window by default). Uses `X-Forwarded-For` header for proxied requests

### Input Validation
- **File size limits** — `MAX_FILE_SIZE` env var caps uploads (default: 10 MB). Enforced at parse time by `@fastify/multipart` and double-checked in route handlers.
- **Content type allowlist** — Only PDF, PNG, JPEG, TIFF, and plain text are accepted. All other types are rejected with a `400` response.
- **UUID validation** — The `:id` route parameter is validated against the UUID v4 format before any DB query runs. Invalid IDs return `400` immediately.

### API Documentation
- **OpenAPI/Swagger** — Auto-generated from Fastify route schemas. Interactive documentation UI served at `GET /docs`. Every endpoint has summary, description, request/response schemas, and example values.

### Observability
- **Request ID tracing** — Every request gets a unique `X-Request-ID` (auto-generated via `crypto.randomUUID()` if the client doesn't provide one). All log lines include this ID, making it trivial to trace a request across services.
- **Structured logging** — Pino logger with JSON output. Includes `requestId`, `method`, `url`, `statusCode`, and `responseTime` on every response.
- **Response time tracking** — Custom timing hook logs response time in milliseconds on every request, enabling latency analysis.
- **Health probes** — Liveness probe (`GET /health`) for process health; readiness probe (`GET /ready`) checks database connectivity before accepting traffic.

### Error Handling
- **Descriptive error messages** — API errors include actionable details (e.g., "Unsupported file type 'application/zip'. Allowed: application/pdf, image/png, ...").
- **Graceful degradation** — S3 upload failures return `500` with a retry suggestion. Worker failures mark documents as `FAILED` with the error message preserved in `last_error`.
- **No sensitive data leakage** — Error responses never expose internal stack traces or infrastructure details to the client.

### CI/CD
- **pnpm store caching** — GitHub Actions cache the `pnpm` store and `node_modules/.cache`, cutting install time from ~60s to ~10s on repeated runs.
- **Frozen lockfile installs** — `pnpm install --frozen-lockfile` ensures CI never diverges from the committed lockfile.
- **Terraform setup action** — Uses `hashicorp/setup-terraform` for consistent IaC provisioning in CI.
- **Service containers** — PostgreSQL and Floci run as GitHub Actions service containers with health checks.

### Code Quality
- **Biome** — Lightning-fast linting and formatting across the entire monorepo.
- **TypeScript strict mode** — Enabled in all packages. No `any`, no implicit `any`.
- **Pre-commit hooks** — Husky + lint-staged runs Biome lint/format on staged files before every commit, preventing bad code from entering the repository.
- **Zod-validated config** — All environment variables are validated at startup. Misconfigured env vars fail fast with descriptive errors.
- **Centralised AWS config** — `S3_BUCKET`, `SQS_QUEUE_URL`, and other AWS settings live in one Zod schema, consumed by all services.
- **PR & issue templates** — GitHub PR template enforces checklist (lint, typecheck, tests). Bug report and feature request templates guide contributors.
- **Security policy** — `SECURITY.md` defines responsible disclosure process for vulnerability reporting.
- **Comprehensive .gitignore** — Excludes dependencies, build artifacts, secrets, IDE files, OS artifacts, and Terraform state.
- **Dependabot** — Automated weekly dependency update PRs for npm, GitHub Actions, and Docker images.

### Developer Tooling
- **Justfile** — Clean command reference for all dev operations. Run `just` to see available commands. Requires [just](https://just.systems).
- **Test script split** — `pnpm run test` (unit, CI-safe), `pnpm run test:e2e` (requires infra), `pnpm run test:all` (local only).

### Testing Strategy
The project uses a **three-layer testing strategy**:

| Layer              | Tool        | What It Covers                          | CI? |
| ------------------ | ----------- | --------------------------------------- | --- |
| **Unit**           | Vitest      | Business logic, DB operations, claims   | Yes — runs against service containers |
| **Integration**    | Vitest      | Worker handlers, message parsing        | Yes — bundled with unit tests |
| **End-to-End**     | Playwright  | Full upload → process → verify pipeline | No  — local only (requires full Docker stack) |

E2E tests upload real PDFs and images, then **poll the API until the document reaches `PROCESSED` status** — verifying the entire async pipeline works end-to-end.
