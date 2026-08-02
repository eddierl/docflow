# ADR-003: Turborepo for Monorepo Orchestration

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

DocFlow has 3 application services (API, Worker, Outbox Worker) and 6 shared packages (config, database, events, aws, logger, shared). We need a build system that:

1. Understands the dependency graph between packages
2. Runs tasks (dev, typecheck, test) incrementally — only rebuilding what changed
3. Works well with `pnpm` workspaces

## Decision

Use **Turborepo** as the monorepo task runner and build system, layered on top of `pnpm` workspaces.

## Consequences

### Positive
- **Incremental builds** — Turborepo caches task outputs and only re-runs tasks for changed packages and their dependents. This makes `pnpm run typecheck` fast on subsequent runs.
- **Parallel execution** — Independent tasks (e.g., `dev` for each app) run in parallel automatically.
- **pnpm native** — Turborepo integrates cleanly with `pnpm` workspaces. No need for a separate package manager.
- **Simple configuration** — `turbo.json` is a single file with clear task definitions and dependency declarations.
- **Remote caching ready** — Turborepo's remote cache feature can be enabled later for CI speed-ups without changing the local dev experience.

### Negative
- **Additional abstraction** — Developers need to understand both `pnpm` and `turbo` concepts. For a small project, this might be overkill.
- **Vercel ecosystem** — Turborepo is built by Vercel and is optimised for Next.js projects. Some features (like RSC caching) are irrelevant to our backend-only stack.
- **Cache invalidation** — Turborepo's cache key includes file hashes. In CI, this means first runs are slow until the cache is populated.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Nx** | More feature-rich but heavier; requires learning Nx-specific concepts (affected, graph UI). Overkill for a 9-package monorepo. |
| **pnpm workspaces only** | Works for `install`, but doesn't provide task orchestration or caching. Would need manual scripts. |
| **Lerna** | Legacy tooling; designed for npm/yarn. Doesn't integrate well with pnpm. |
| **Yarn workspaces** | Would require switching package managers; pnpm is faster and more disk-efficient. |

## When Would Nx Be Better?

If the project grows to 20+ packages, adds a frontend app, or needs features like interactive task graphs and built-to-production daemon, Nx would become more attractive. For now, Turborepo's simplicity is the right trade-off.

## Related

- [ADR-006: Biome over ESLint + Prettier](./006-biome-over-eslint.md)
