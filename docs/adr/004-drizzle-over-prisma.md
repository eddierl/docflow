# ADR-004: Drizzle ORM over Prisma

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

We need a type-safe way to interact with PostgreSQL from TypeScript. The two most popular options in the Node.js ecosystem are Prisma and Drizzle ORM.

## Decision

Use **Drizzle ORM** for all database interactions.

## Consequences

### Positive
- **Type safety without code generation** — Drizzle infers TypeScript types from the schema definition at compile time. No `prisma generate` step needed.
- **Smaller bundle** — Drizzle has zero runtime dependencies. Prisma adds a ~40 MB binary (`@prisma/engine`) to the Docker image.
- **Faster cold starts** — Critical for serverless (Lambda) deployments. Drizzle starts in milliseconds; Prisma's engine add ~2 seconds.
- **SQL-like mental model** — Drizzle queries read like SQL (`select*.from(table).where(eq(...))`). This makes it easier to reason about what query is actually generated.
- **First-class PostgreSQL support** — Drizzle handles PostgreSQL-specific features (JSONB, arrays, `SKIP LOCKED`) naturally.

### Negative
- **Smaller ecosystem** — Prisma has a larger community, better documentation, and a more polished Studio UI. Drizzle's studio is still maturing.
- **Less magic** — Prisma's relation loading (`include: { relations }`) is convenient but hides N+1 queries. Drizzle forces you to write explicit joins, which is more verbose but more transparent.
- **Migration tooling** — Drizzle's `drizzle-kit` is good but less battle-tested than Prisma's migration system.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Prisma** | Larger bundle, code generation step, hides N+1 queries. Great tool, but Drizzle is a better fit for this project's constraints. |
| **Knex.js** | Raw query builder without type inference. Would lose the type safety benefit. |
| **Raw SQL** | Maximum control but no type safety, no migration tooling, more boilerplate. |
| **TypeORM** | Heavy, uses decorators (opinionated), slower than Drizzle. |

## Key Usage Pattern

All database queries live in `packages/database/`. The schema is defined in TypeScript and shared across all services:

```typescript
// packages/database/src/schema.ts
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  status: documentStatus("status").default("UPLOADED").notNull(),
  // ...
});

// Type-safe query — `doc` is automatically typed
const doc = await db.select().from(documents).where(eq(documents.id, id));
```

## Related

- [ADR-001: Transactional Outbox](./001-transactional-outbox.md) — Uses Drizzle's transaction API
