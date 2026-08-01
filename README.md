# DocFlow

**A production-grade, event-driven document processing platform** — built by [Eddie Erlich](#-about-me) as a portfolio project to showcase cloud-native engineering skills.

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-SQS%20%7C%20S3%20%7C%20Lambda-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Playwright-e04e4c?logo=vitest&logoColor=white)](https://vitest.dev/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![Availability](https://img.shields.io/badge/Status-Actively%20Seeking%20in%20AU-green?style=flat)](#-lets-talk)

</div>

---

## 👋 About Me

Hi, I'm **Eddie Erlich** — a backend software engineer with 5+ years of experience, now based in **Perth, Western Australia**.

I moved to Australia over a year ago with a clear goal: build a long-term career in the Australian tech industry. The transition hasn't been straightforward — navigating a new market, a new timezone, and a new professional network takes time. But I refused to let that slow down my craft.

So I built DocFlow.

### Why This Project Exists

This isn't a tutorial clone, a weekend experiment, or something I followed along with on YouTube. It's a **production-grade, event-driven document processing platform** that I designed, architected, and implemented entirely from scratch — every line of TypeScript, every Terraform module, every Dockerfile, every test.

I built it to the standard I'd expect from an engineer joining my team. Every architectural decision was a deliberate trade-off, and I've documented the reasoning in [Architecture Decision Records](./docs/adr/README.md) because the _why_ matters more than the _what_.

While I've been job searching, I haven't been idle. I've been:

- **Building production-grade systems** — DocFlow implements patterns used at companies like Atlassian, Canva, and Stripe
- **Studying the Australian tech landscape** — from ASX-listed tech companies to well-funded startups, I understand this market
- **Deepening my craft** — every ADR I wrote, every test I added, every Dockerfile I optimised was a deliberate investment in skill
- **Preparing to contribute** — this project is my way of saying "here's what I can do, starting on day one"

### What I Bring

| Area | What I Do |
|------|-----------|
| **Backend Engineering** | REST APIs, event-driven systems, message queues, database design |
| **Cloud-Native Architecture** | AWS (SQS, S3, Lambda, ECS), Terraform IaC, containerisation |
| **Reliable Systems** | Transactional outbox pattern, idempotency, dead letter queues, graceful shutdown |
| **Developer Experience** | Monorepos (Turborepo), strict TypeScript, CI/CD pipelines, comprehensive docs |
| **Testing** | Unit tests (Vitest), integration tests, end-to-end tests (Playwright) |

### Technical Skills

```
TypeScript ████████████████████  Expert    — 5+ years, strict mode, generics, design patterns
Node.js    ████████████████████  Expert    — Fastify, Express, streaming APIs
AWS        ██████████████████    Advanced  — SQS, S3, Lambda, ECS, API Gateway
PostgreSQL ██████████████████    Advanced  — Schema design, migrations, Drizzle ORM
Terraform  ████████████████      Proficient — IaC, modules, state management
Docker     ████████████████      Proficient — Compose, multi-stage builds
CI/CD      ████████████████      Proficient — GitHub Actions, caching strategies
Testing    ████████████████      Proficient — Vitest, Playwright, TDD mindset
Linux/DevOps ██████████████       Competent — Shell scripting, Nginx, monitoring
```

> **_Note:_** Skill levels reflect my honest self-assessment and are open to discussion. I'm comfortable being tested on any of these.

### What I'm Looking For

I'm seeking a **Software Engineer** or **Backend Engineer** role, ideally with:

- Event-driven or distributed systems (the kind of problems DocFlow solves)
- A team that values code quality, testing, and developer experience
- Opportunities to mentor and be mentored — I learn fastest by doing
- **Open to all seniority levels** from Mid-weight through Senior — I want the bar to be set by the team

I'm based in **Perth, WA** and available for hybrid or remote roles anywhere in Australia. I'm **available immediately**.

### 📬 Get in Touch

📧 **Email:** [edlich6@gmail.com](mailto:edlich6@gmail.com) &nbsp;|&nbsp; 🔗 **[LinkedIn](https://linkedin.com/in/your-profile)** &nbsp;|&nbsp; 💻 **[GitHub](https://github.com/eddierl)**

> **⚠️ Replace the LinkedIn URL above with your real profile before sharing this repo with employers.**

---

## 📖 What Is DocFlow?

DocFlow is a full-stack, event-driven application designed to process documents reliably and efficiently. Users upload PDFs, images, or text files through a REST API. Background workers extract text using PDF parsing and OCR, storing results in a PostgreSQL database.

It's designed to demonstrate **real-world engineering decisions** — not just a CRUD app. Every architectural choice here solves a concrete problem you'd encounter in production.

### What Makes This Different

- **Reliable messaging** — The transactional outbox pattern guarantees no message is lost between services, even under network failures
- **Graceful failure** — Dead letter queues and retry logic mean failed documents don't vanish into the void
- **Infrastructure as Code** — Every AWS resource is defined in Terraform. No clicking through consoles
- **End-to-end testing** — E2E tests verify the full async pipeline: upload → process → verify
- **Production hardening** — Rate limiting, CORS, security headers, request tracing, structured logging
- **Developer experience** — Monorepo with shared packages, strict TypeScript, Biome for linting
- **Container-ready** — Multi-stage Dockerfiles for each service, with health checks
- **Pre-commit discipline** — Husky + lint-staged prevents bad code from ever entering the repo

### Problems It Solves

| Problem in Production              | How DocFlow Solves It                              |
| ---------------------------------- | -------------------------------------------------- |
| Messages lost between services     | **Transactional Outbox** — DB + event in one tx    |
| Poison-pill messages stall queues  | **Dead Letter Queue** with automatic failure tracking |
| Multiple workers process same job  | **Optimistic claim lock** via DB                   |
| Inconsistent local vs prod envs    | **Docker + Floci** — identical AWS emulator locally |
| Manual, error-prone infra setup    | **Terraform** — reproducible infrastructure        |

## 🛠 Tech Stack

- **Turborepo & pnpm** — High-performance monorepo with 3 apps and 6 shared packages
- **Fastify** — Lightweight, fast REST API with multipart file upload support
- **Drizzle ORM & PostgreSQL** — Type-safe database with schema migrations
- **AWS SQS & S3** (via Floci locally) — Async message queue and object storage
- **Terraform** — Infrastructure as Code for SQS queues, DLQs, and S3 buckets
- **Tesseract.js** — OCR for scanned image documents
- **pdf-parse** — Text extraction from PDF files
- **Playwright** — End-to-end testing with polling-based async verification
- **Vitest** — Fast unit and integration tests
- **Biome** — Lightning-fast linting and formatting

## 🏗 Architecture

```
Client ──► API (Fastify) ──► S3 + PostgreSQL ──► Outbox Worker ──► SQS ──► Worker ──► Done
                    │                                                      │
                    └── GET /documents/:id                           DLQ (3 retries)
```

For a deep dive into every component, data flow, and architectural pattern, see [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).

### Repository Structure

```
docflow/
├── apps/
│   ├── api/             # Fastify REST API — upload & query documents
│   ├── worker/          # SQS consumer — processes documents (PDF, OCR)
│   ├── outbox-worker/   # Transactional outbox — publishes events to SQS
│   └── e2e/             # Playwright E2E test suite
├── packages/
│   ├── aws/             # Shared AWS SDK clients (S3, SQS)
│   ├── config/          # Centralised Zod-validated environment config
│   ├── database/        # Drizzle ORM schemas, migrations, queries
│   ├── events/          # Event type definitions and validation schemas
│   ├── logger/          # Pino structured logging
│   └── shared/          # Shared utilities
├── terraform/           # IaC — SQS, DLQ, S3 (provisions against Floci)
├── docs/adr/            # Architecture Decision Records — the "why" behind every choice
└── docker-compose.yml   # Full stack — PostgreSQL + Floci + all 3 app services
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22+
- **Docker & Docker Compose**
- **pnpm** v11+
- **Terraform**

### Quick Start (Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start local infrastructure (PostgreSQL + Floci)
pnpm run infra

# 3. Provision AWS resources (SQS queues, S3 bucket)
pnpm run terraform:init
pnpm run terraform:apply

# 4. Run database migrations
pnpm run db:migrate

# 5. Start all services (waits for infra to be ready first)
just dev:wait
```

The API is now running at **http://localhost:3000**.

> **Tip:** Use `just wait-infra` to check if PostgreSQL and Floci are ready before starting services manually. Use `just health-all` to verify all services are healthy.

For a full one-command bootstrap (install deps, start infra, provision AWS, run migrations, and start services):

```bash
just start
```

### Quick Start (Docker)

```bash
# Build and run the full stack in containers
docker compose build
docker compose up
```

This starts PostgreSQL, Floci, and all three application services in containers — matching how the system would run in production.

### Try It Out

```bash
# Upload a PDF
curl -X POST http://localhost:3000/documents \
  -F "file=@/path/to/document.pdf"

# Check status
curl http://localhost:3000/documents/<document-id>

# Health check (liveness)
curl http://localhost:3000/health

# Readiness check (database connectivity)
curl http://localhost:3000/ready

# Interactive API docs (auto-generated)
open http://localhost:3000/docs
```

## 🧪 Testing

This project uses a **three-layer testing strategy**:

| Layer              | Tool        | What It Covers                          |
| ------------------ | ----------- | --------------------------------------- |
| **Unit**           | Vitest      | Business logic, DB operations, claims   |
| **Integration**    | Vitest      | Worker handlers, message parsing        |
| **End-to-End**     | Playwright  | Full upload → process → verify pipeline |

```bash
# Run unit tests (default — runs in CI)
pnpm run test

# Run E2E tests (requires infra + app running)
pnpm run test:e2e

# Run everything (unit + E2E, local only)
pnpm run test:all
```

E2E tests upload real PDFs and images, then **poll the API until the document reaches `PROCESSED` status** — verifying the entire async pipeline works end-to-end.

## ✅ Code Quality

```bash
pnpm run typecheck   # TypeScript type checking across all packages
pnpm run lint        # Biome linting
pnpm run format      # Biome formatting
```

Pre-commit hooks (Husky + lint-staged) run automatically on every commit, so bad code never enters the repository.

## 📈 Key Architectural Patterns

### Transactional Outbox Pattern
Ensures reliable message publishing even if the network to SQS fails after the database commit. The outbox worker polls the database and publishes pending events with `FOR UPDATE SKIP LOCKED` for safe concurrency.

### Event-Driven Architecture
The API accepts requests and returns immediately. Heavy document processing happens asynchronously in background workers, decoupled via SQS.

### Optimistic Claim Lock
Workers claim documents using a single atomic `UPDATE ... WHERE` query. PostgreSQL serializes writes, so only one worker ever wins — no distributed locking needed.

### Dead Letter Queue & Failure Handling
Messages that fail 3 times are moved to a DLQ. The worker monitors the DLQ and marks documents as `FAILED` with error details, ensuring nothing is silently lost.

### Infrastructure as Code
All AWS resources (SQS queues, DLQs, S3 buckets) are defined in Terraform and provisioned against Floci locally — identical to what would deploy to real AWS.

## 🛡 Production Best Practices

This isn't just a demo — it's built to production standards:

| Practice                 | Implementation                                      |
| ------------------------ | --------------------------------------------------- |
| **Security headers**     | Helmet — automatic `X-Frame-Options`, `X-Content-Type-Options`, and more |
| **CORS**                 | Configurable origin allowlist via `CORS_ORIGINS` env var |
| **Rate limiting**        | 100 requests per 15-second window, IP-based |
| **File upload limits**   | 10 MB cap + content-type allowlist (PDF, PNG, JPEG, TIFF, TXT) |
| **Input validation**     | UUID format enforced on route params; Zod on all env vars |
| **API documentation**    | OpenAPI/Swagger auto-generated from route schemas, served at `/docs` |
| **Request tracing**      | `X-Request-ID` header auto-generated and logged on every request |
| **Structured logging**   | Pino JSON logs with `requestId`, `statusCode`, `responseTime` |
| **Health probes**        | Liveness (`/health`) + readiness (`/ready` with DB check) |
| **Graceful errors**      | Descriptive JSON errors — no stack traces leaked to clients |
| **CI caching**           | `pnpm` store cached in GitHub Actions for fast repeated runs |
| **Frozen lockfile**      | `pnpm install --frozen-lockfile` in CI prevents drift |
| **Type-safe everywhere** | TypeScript strict mode + Drizzle ORM + Zod schemas |
| **Pre-commit hooks**     | Husky + lint-staged runs Biome on staged files |
| **Docker healthchecks**  | API container includes HEALTHCHECK for orchestrator support |

## 🔑 Key Metrics

| Metric                    | Value                                    |
| ------------------------- | ---------------------------------------- |
| TypeScript coverage       | 100% — every file is TypeScript          |
| Monorepo packages         | 3 apps + 6 shared packages               |
| E2E test scenarios        | PDF extraction, image OCR, text pass-through |
| DB tables                 | 2 (documents, outbox_events)             |
| API endpoints             | 5 (health, readiness, upload, get, docs) |
| Graceful shutdown         | All 3 services handle SIGTERM/SIGINT     |

## 💡 What to Ask Me in an Interview

Every architectural decision in this project is a conversation starter. Here are the ones I find most interesting:

1. **Why the transactional outbox instead of direct SQS calls?** — Trade-off between consistency and complexity. What would you do differently?
2. **Why `FOR UPDATE SKIP LOCKED` for the outbox worker?** — PostgreSQL-specific concurrency pattern. How does this compare to Redis-based locking?
3. **Why Floci instead of LocalStack?** — Floci is lighter weight and focuses on SQS/S3. Would LocalStack be better for a broader set of services?
4. **Why Turborepo over Nx?** — Simplicity vs. feature richness. When does the investment in Nx pay off?
5. **The optimistic claim lock pattern** — Using DB writes as distributed locks. What are the failure modes?

---

## 📬 Let's Talk

I'm actively seeking a software engineering role in Australia. If you're a hiring manager, engineering lead, or recruiter — or if you're just curious about the architecture — I'd love to hear from you.

This project represents the kind of work I want to do every day. I'm **available immediately** and ready to contribute from day one.

📧 **Email:** [edlich6@gmail.com](mailto:edlich6@gmail.com) &nbsp;|&nbsp; 🔗 **[LinkedIn](https://linkedin.com/in/your-profile)** &nbsp;|&nbsp; 💻 **[GitHub](https://github.com/eddierl)**

> **⚠️ Replace the LinkedIn URL above with your real profile before sharing this repo.**

## 🤝 Contributing

Found a bug or want to improve something? See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and PR guidelines.

## 📄 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for guidance on deploying to real AWS (Lambda, ECS, RDS).

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a history of changes.

---

*"The best way to show what you can do is to build something that actually works."*
