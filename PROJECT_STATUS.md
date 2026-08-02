# Project Status

A transparent view of what's built, what's in progress, and what's planned. This is useful for interview discussions — every item here is a conversation starter about trade-offs and engineering decisions.

---

## ✅ Completed

### Core Platform

- [x] **Fastify REST API** with multipart file upload, rate limiting, CORS, security headers
- [x] **Document processing worker** — PDF text extraction, image OCR (Tesseract.js), text pass-through
- [x] **Transactional outbox pattern** — guaranteed event delivery from DB to SQS
- [x] **Optimistic claim lock** — prevents duplicate processing across worker instances
- [x] **Dead Letter Queue** — automatic failure tracking after 3 retries
- [x] **Graceful shutdown** — SIGTERM/SIGINT handling in all 3 services
- [x] **Structured logging** — Pino JSON logs with request tracing via `X-Request-ID`

### Infrastructure

- [x] **Docker Compose** — full local stack (PostgreSQL + Floci + 3 app services)
- [x] **Multi-stage Dockerfiles** — minimal production images with non-root users
- [x] **Health checks** — liveness (`/health`) and readiness (`/ready`) probes on all 3 services
- [x] **Terraform IaC** — SQS queues, DLQs, S3 buckets provisioned against Floci locally
- [x] **Floci** — local AWS emulator for SQS and S3 (pinned to `:2` major version)

### Developer Experience

- [x] **Turborepo monorepo** — 3 apps + 6 shared packages with incremental builds
- [x] **Strict TypeScript** — 100% TypeScript, strict mode enabled
- [x] **Biome** — fast linting and formatting (replaces ESLint + Prettier)
- [x] **Husky + lint-staged** — pre-commit hooks prevent bad code from entering the repo
- [x] **GitHub Actions CI** — lint, typecheck, and unit tests on every push/PR
- [x] **Justfile** — clean command reference for all dev operations
- [x] **Dependabot** — automated dependency update PRs for npm, GitHub Actions, and Docker
- [x] **Startup health check script** — `wait-for-it.sh` wired into `just dev:wait` and `just start`
- [x] **CODEOWNERS** — defined code ownership for review routing

### Testing

- [x] **Unit tests** — Vitest tests for business logic, DB operations, claim locks
- [x] **Integration tests** — worker handlers, message parsing
- [x] **E2E tests** — Playwright tests verifying full async pipeline with polling
- [x] **Split test scripts** — `test` (unit, CI-safe), `test:e2e` (requires infra), `test:all` (local)

### Production Hardening

- [x] **CPU backoff in worker polling loop** — sleep when queue is empty to prevent CPU spin
- [x] **Health endpoints on all services** — API (:3000), outbox-worker (:3001), worker (:3002)
- [x] **Docker HEALTHCHECK instructions** — all 3 service Dockerfiles include health probes
- [x] **Pinned Floci version** — `floci/floci:2` for deterministic builds
- [x] **Docker security hardening** — non-root users following CIS Docker Benchmark 1.2

### Documentation & Best Practices

- [x] **INFRASTRUCTURE.md** — architecture diagrams, data flows, environment variables
- [x] **Architecture Decision Records (ADRs)** — 6 ADRs documenting key architectural trade-offs
- [x] **TROUBLESHOOTING.md** — common issues and solutions
- [x] **DEPLOYMENT.md** — AWS deployment guide (Lambda, ECS)
- [x] **SECURITY.md** — security policy and vulnerability disclosure
- [x] **CODE_OF_CONDUCT.md** — Contributor Covenant v2.1
- [x] **CONTRIBUTING.md** — setup instructions and PR guidelines
- [x] **CHANGELOG.md** — Conventional Commits changelog
- [x] **.editorconfig** — consistent code style across editors
- [x] **Personal branding** — README with authentic narrative, interview conversation starters

---

## 🚧 In Progress

- [ ] **Docker build verification** — Docker Hub unreachable; pending network resolution

---

## 📋 Planned

### Near-term (next iteration)

- [ ] **E2E tests in CI** — run Playwright tests against the full stack in GitHub Actions
- [ ] **GitHub Actions caching for Terraform** — cache plugin downloads for faster CI
- [ ] **Docker image builds in CI** — push container images to GHCR on merge

### Medium-term (demonstrates additional skills)

- [ ] **Sentry or similar error tracking** — production-grade error monitoring
- [ ] **Metrics endpoint** — Prometheus-compatible `/metrics` for observability
- [ ] **Request timeout handling** — AbortSignal propagation for long-running operations
- [ ] **Database seeding** — fixture data for faster test setup

### Nice-to-have

- [ ] **Load testing** — k6 or Artillery scripts to demonstrate system limits
- [ ] **Interactive demo** — web UI for trying DocFlow in the browser
- [ ] **Multi-region deployment** — Terraform modules for multi-AWS-region setup
- [ ] **Cost estimation** — AWS Cost Explorer estimates for the production architecture

---

## 💡 What to Discuss in an Interview

Every item above is a conversation starter. Here are the ones I find most interesting:

1. **Why the transactional outbox instead of direct SQS calls?** — Trade-off between consistency and complexity. What would you do differently?
2. **Why `FOR UPDATE SKIP LOCKED` for the outbox worker?** — PostgreSQL-specific concurrency pattern. How does this compare to Redis-based locking?
3. **Why Floci instead of LocalStack?** — Floci is lighter weight and focuses on SQS/S3. Would LocalStack be better for a broader set of services?
4. **Why Turborepo over Nx?** — Simplicity vs. feature richness. When does the investment in Nx pay off?
5. **The optimistic claim lock pattern** — Using DB writes as distributed locks. What are the failure modes?

---

*Last updated: July 2025*
