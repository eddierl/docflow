# DocFlow 🚀

A modern, robust, and scalable event-driven monorepo application showcasing best practices in infrastructure, backend architecture, and testing.

## 📖 Overview
DocFlow is a full-stack, event-driven application designed to process documents reliably and efficiently. It demonstrates advanced concepts such as message queuing, Dead Letter Queues (DLQ) for failure handling, Infrastructure as Code (IaC), and comprehensive testing strategies. 

This repository serves as a portfolio piece to highlight proficiency in modern cloud-native development, DevOps practices, and the TypeScript ecosystem.

## 🛠 Tech Stack & Architecture

- **Turborepo & pnpm:** High-performance monorepo build system and package manager.
- **Microservices Architecture:** Segregated into `api`, `worker`, and `outbox-worker` apps for modularity and independent scaling.
- **AWS SQS & DLQ:** Asynchronous event processing with robust error handling and retries using Dead Letter Queues.
- **Floci:** AWS emulator for seamless local development and testing of AWS services without incurring cloud costs.
- **Terraform:** Infrastructure as Code (IaC) to deterministically provision SQS queues, DLQs, and other cloud resources.
- **Docker & Docker Compose:** Containerized local development environment (`postgres`, `floci`) ensuring parity across environments.
- **Drizzle ORM & PostgreSQL:** Type-safe database interactions, schema declarations, and migrations.
- **Playwright:** End-to-End (E2E) testing framework ensuring critical user journeys work flawlessly.
- **Vitest:** Blazing fast unit and integration testing.
- **Biome:** Extremely fast formatter and linter for maintaining high code quality.

## 🏗 Repository Structure

```text
docflow/
├── apps/
│   ├── api/             # Main API handling incoming requests
│   ├── worker/          # SQS consumer processing document jobs
│   ├── outbox-worker/   # Transactional outbox processor for reliable event publishing
│   └── e2e/             # Playwright End-to-End test suite
├── packages/
│   ├── aws/             # Shared AWS clients and utilities
│   ├── config/          # Centralized configuration management
│   ├── database/        # Drizzle ORM schemas, migrations, and clients
│   ├── events/          # Event definitions and types
│   ├── logger/          # Structured logging utilities
│   └── shared/          # Shared business logic and types
├── terraform/           # IaC definitions for AWS resources (SQS, DLQ, IAM, etc.)
└── docker-compose.yml   # Local infrastructure (Postgres, Floci)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v22+)
- Docker & Docker Compose
- pnpm (v11+)
- Terraform

### Setup Instructions

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Start Local Infrastructure:**
   Spin up PostgreSQL and Floci (AWS emulator) locally.
   ```bash
   pnpm run infra
   ```

3. **Provision Infrastructure (Terraform):**
   Initialize and apply Terraform to create the local SQS queues and DLQs in Floci.
   ```bash
   pnpm run terraform:init
   pnpm run terraform:apply
   ```

4. **Run Database Migrations:**
   ```bash
   pnpm run db:migrate
   ```

5. **Start the Application:**
   Choose your worker mode (see [Running the Worker in Docker](#-running-the-worker-in-docker-ecs)):
   ```bash
   pnpm dev:local    # all apps on your machine (API, worker, outbox-worker)
   pnpm dev:docker   # API + outbox-worker locally; worker runs in an ECS container
   ```
   (`pnpm run dev` is an alias of `pnpm dev:local`.)

## 🐳 Running the Worker in Docker (ECS)

The `worker` app can run either on your machine or inside a floci ECS container — everything else stays local. The two dev scripts select the mode:

- `pnpm dev:local` — runs **all** apps (API, worker, outbox-worker) on your machine; the worker reads the root `.env` (e.g. `AWS_ENDPOINT=http://localhost:4566`).
- `pnpm dev:docker` — runs **API + outbox-worker** locally; the worker lives in the ECS container.

### Worker image lifecycle

```bash
pnpm worker:docker:up        # build → push to floci ECR → deploy (recommended loop)
pnpm worker:docker:build     # docker build -f Dockerfile.worker
pnpm worker:docker:push      # login + push to the floci registry, then re-tag for ECS
pnpm worker:docker:deploy    # restart the service (desired-count 0 → 1)
pnpm worker:docker:status    # describe the worker service
```

The container gets its environment from the ECS task definition (`terraform/ecs.tf`), not from a `.env` file — `.env` is excluded from the image via `.dockerignore`, and the task definition points `DATABASE_URL` / `AWS_ENDPOINT` at `host.docker.internal` so the container reaches your local Postgres and Floci.

### Two floci quirks to know about

- **Digest pinning:** ECS snapshots the `:latest` tag to a concrete image digest when a task starts. Pushing a new `:latest` does *not* update the running task on its own — that's why `worker:docker:deploy` does a desired-count 0 → stable → 1 restart, which makes the service re-resolve the tag.
- **Registry address:** `docker login localhost:5100` can hang on macOS (IPv6 `::1` path in the Docker CLI). The scripts therefore push to `127.0.0.1:5100` and re-tag the image as `000000000000.dkr.ecr.us-east-1.localhost:5100/docflow-worker:latest` — the exact image name the task definition references.

### Running both modes at once

Safe: SQS long-polling is an exclusive receive and the worker deduplicates claims in the database, so a local worker and the containerized worker can poll the same queue without double-processing.

### Pointing at real AWS

The same shape works in real AWS: swap the registry URL/credentials for your real ECR repo, set real endpoints in the task definition, and consider immutable tags (e.g. build digests) instead of `latest` so the task definition pins an explicit image.

### OCR note

Tesseract downloads `eng.traineddata` from jsDelivr on first use. On the host that copy is reused (gitignored); inside the container it is re-downloaded per task until you mount a volume for `apps/worker/`.

## 🧪 Testing

This project takes testing seriously, employing both unit/integration tests and full end-to-end testing.

- **Unit & Integration:** Run `vitest` tests across packages and apps.
- **E2E Testing:** Run Playwright tests located in `apps/e2e/`.

## 📈 Key Patterns Demonstrated

- **Transactional Outbox Pattern:** Ensures reliable message publishing to SQS even if the database transaction commits but the network request to AWS fails.
- **Event-Driven Architecture:** Decouples services, allowing the API to quickly accept requests while background workers handle heavy processing.
- **Resilience:** SQS Dead Letter Queues ensure that poison-pill messages or temporary downstream outages do not result in data loss.

## 👨‍💻 About the Author

This repository demonstrates my ability to design, build, and deploy production-ready backend systems using modern tooling. I am actively looking for a backend/full-stack engineering role. If you are hiring, please reach out!
