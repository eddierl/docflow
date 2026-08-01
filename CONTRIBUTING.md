# Contributing to DocFlow

Thank you for your interest in contributing! DocFlow is a portfolio project built to demonstrate production-grade, event-driven architecture. While it's primarily a personal showcase, I welcome constructive contributions that improve the codebase.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/eddierl/docflow.git
cd docflow
pnpm install

# 2. Start local infrastructure (PostgreSQL + Floci AWS emulator)
pnpm run infra

# 3. Provision AWS resources (SQS queues, S3 bucket)
pnpm run terraform:init
pnpm run terraform:apply

# 4. Run database migrations
pnpm run db:migrate

# 5. Start all services
pnpm run dev
```

The API will be available at `http://localhost:3000`.

## Project Structure

This is a **Turborepo monorepo** with 3 apps and 6 shared packages:

| Path | Purpose |
|------|---------|
| `apps/api/` | Fastify REST API — upload & query documents |
| `apps/worker/` | SQS consumer — processes documents (PDF, OCR) |
| `apps/outbox-worker/` | Transactional outbox — publishes events to SQS |
| `apps/e2e/` | Playwright E2E test suite |
| `packages/aws/` | Shared AWS SDK clients (S3, SQS) |
| `packages/config/` | Centralised Zod-validated environment config |
| `packages/database/` | Drizzle ORM schemas, migrations, queries |
| `packages/events/` | Event type definitions and validation schemas |
| `packages/logger/` | Pino structured logging |
| `packages/shared/` | Shared utilities |

## Development Workflow

### Code Quality

Every change must pass these checks before merging:

```bash
pnpm lint       # Biome linting
pnpm typecheck  # TypeScript type checking
pnpm test       # Unit + integration tests
```

Fix lint issues automatically:

```bash
pnpm lint:fix
pnpm format
```

### Adding a New Shared Package

1. Create the package under `packages/`
2. Add a `package.json` with `"private": true` and a `type: "module"`
3. Extend `pnpm-workspace.yaml` if needed
4. Reference it from apps using `@docflow/<package-name>`

### Database Changes

1. Update the schema in `packages/database/src/schema.ts`
2. Generate a migration: `pnpm --filter @docflow/database db:generate`
3. Apply locally: `pnpm run db:migrate`

### Environment Variables

All env vars are validated at startup via Zod schemas in `@docflow/config`. Add new vars to the appropriate schema file (`aws.ts`, `db.ts`) and update `.env.example`.

See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for the full env var reference.

## Architecture Patterns

Before making changes, familiarise yourself with the key patterns:

- **Transactional Outbox** — DB writes and event publishing in one transaction
- **Optimistic Claim Lock** — Workers claim documents via atomic DB updates
- **Dead Letter Queue** — Failed messages move to DLQ after 3 retries
- **Event-Driven Processing** — API returns immediately; workers process async

See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed data flows and component diagrams.

## Pull Request Guidelines

1. **Write a clear title** — e.g., "Add file size validation to upload endpoint"
2. **Describe the problem** — What issue does this solve?
3. **Explain the approach** — Why this solution over alternatives?
4. **Include tests** — New features should have unit or integration tests
5. **Update docs** — If behaviour changes, update README or INFRASTRUCTURE.md

## Reporting Issues

Found a bug or have an idea? Open an issue with:

- **Steps to reproduce** (for bugs)
- **Expected vs actual behaviour**
- **Relevant logs or error messages**

## Code Style

- **Biome** handles linting and formatting — run `pnpm lint:fix` before committing
- **TypeScript strict mode** is enabled — no `any`, no implicit `any`
- **Prefer explicit returns** over implicit returns in arrow functions for multi-line bodies
- **Comment the "why", not the "what"** — code should be self-explanatory

---

*This project is maintained by [Eddie](./README.md), a software developer based in Australia.*
