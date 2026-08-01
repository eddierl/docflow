# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Multi-stage Dockerfiles for API, Worker, and Outbox Worker (Node 22 Alpine + tsx)
- Shared `.dockerignore` for lean Docker build contexts
- Docker HEALTHCHECK instruction on the API container
- Husky pre-commit hooks with lint-staged (Biome lint + format)
- GitHub PR template with checklist and issue templates (bug report, feature request)
- `SECURITY.md` with responsible disclosure policy
- `CODE_OF_CONDUCT.md` adapted from Contributor Covenant v2.1
- Expanded `.gitignore` with IDE, OS, log, and Terraform state exclusions
- `LICENSE` (MIT) and `.editorconfig` for consistent code style
- `CHANGELOG.md` for tracking releases

### Changed
- `INFRASTRUCTURE.md` — Added Container Deployment section and expanded Code Quality docs
- `README.md` — Rewritten with personal story, skills matrix, and best practices table
- `package.json` — Added husky, lint-staged, and `prepare` script

### Fixed
- `apps/outbox-worker/package.json` — Added missing `version` field

---

## [0.1.0] — 2025-07-13

Initial portfolio release.

### Features
- Fastify REST API with file upload, document query, health probes, and Swagger docs
- Event-driven document processing pipeline (PDF extraction + image OCR)
- Transactional outbox pattern for reliable messaging
- SQS dead letter queue with automatic failure tracking
- Optimistic claim lock for worker concurrency safety
- Turborepo monorepo with 3 apps and 6 shared packages
- End-to-end tests with Playwright (polling-based async verification)
- Local infrastructure via Docker Compose (PostgreSQL + Floci AWS emulator)
- Terraform IaC for SQS queues, DLQs, and S3 buckets
- GitHub Actions CI with pnpm caching and service containers
- Production hardening: Helmet, CORS, rate limiting, request tracing, structured logging

[Unreleased]: https://github.com/eddierl/docflow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/eddierl/docflow/releases/tag/v0.1.0
