# Architecture Decision Records (ADRs)

This directory captures the key architectural decisions made during the design and implementation of DocFlow. Each record explains **what** was decided, **why**, and what **trade-offs** were considered.

> ADRs are a living document. They are not meant to be immutable — they are a conversation starter. If you disagree with a decision, open an issue or PR proposing a change.

## Index

| # | Decision | Status |
|---|----------|--------|
| [001](./001-transactional-outbox.md) | Use the Transactional Outbox pattern for reliable messaging | Accepted |
| [002](./002-floci-over-localstack.md) | Use Floci instead of LocalStack for local AWS emulation | Accepted |
| [003](./003-turborepo-monorepo.md) | Use Turborepo for monorepo orchestration | Accepted |
| [004](./004-drizzle-over-prisma.md) | Use Drizzle ORM instead of Prisma | Accepted |
| [005](./005-sqs-over-eventbridge.md) | Use SQS for async messaging instead of EventBridge | Accepted |
| [006](./006-biome-over-eslint.md) | Use Biome instead of ESLint + Prettier | Accepted |

## What Is an ADR?

An Architecture Decision Record is a short markdown file that captures:

- **Context** — What problem are we solving?
- **Decision** — What did we choose?
- **Consequences** — What are the trade-offs (positive and negative)?
- **Status** — Is this decision still valid, deprecated, or superseded?

This format is inspired by [Michael Nygard's original ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) and the [adr-tools](https://github.com/npryce/adr-tools) convention.
