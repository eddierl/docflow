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
   Run all services (API, Workers) concurrently.
   ```bash
   pnpm run dev
   ```

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
