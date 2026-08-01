# ADR-006: Biome over ESLint + Prettier

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

Every TypeScript project needs linting (code quality rules) and formatting (consistent style). The traditional stack is ESLint + Prettier, which has two problems:

1. **Slow** — ESLint loads plugins and rules in JavaScript. On a monorepo with 9 packages, linting takes seconds.
2. **Conflict-prone** — ESLint and Prettier sometimes disagree (e.g., arrow function parentheses), requiring `eslint-config-prettier` to disable conflicting rules.

## Decision

Use **Biome** (`@biomejs/biome`) as the unified linter and formatter.

## Consequences

### Positive
- **Blazing fast** — Biome is written in Rust and compiled to a native binary. Linting the entire monorepo takes ~100ms vs. ~5s for ESLint.
- **Single tool** — Linting and formatting are unified. No conflict between tools, no `eslint-config-prettier` shim needed.
- **Auto-fix everything** — Biome can fix both lint issues and formatting in a single pass (`biome check --write`).
- **Better monorepo support** — Biome understands workspace structure and can lint the entire repo from the root with a single `biome.json` config.
- **Lower maintenance** — One config file (`biome.json`) instead of two (`.eslintrc`, `.prettierrc`) plus a reconciliation layer.

### Negative
- **Younger ecosystem** — Biome is newer than ESLint. Some edge-case rules may not be implemented yet.
- **No custom rules** — ESLint allows writing custom rules in JavaScript. Biome's plugin system is still maturing. For this project, the built-in rules are sufficient.
- **Migration cost** — If the team later needs a rule that Biome doesn't support, switching back to ESLint would require reconfiguring everything.

## Configuration

Our `biome.json` enables:
- **Strict TypeScript rules** — No `any`, no implicit `any`, no unused variables
- **Style consistency** — Consistent quotes, indentation, and import ordering
- **Safe auto-fixes** — `biome check --write --unsafe` in pre-commit hooks for staged files

## Pre-commit Integration

```json
// package.json
"lint-staged": {
  "**/*.{ts,tsx,js,jsx}": ["biome check --write --unsafe"],
  "**/*.{json,md,yml,yaml}": ["biome format --write"]
}
```

This runs on every commit via Husky, ensuring bad code never enters the repository.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **ESLint + Prettier** | Slow, two tools that conflict, complex config. The incumbent, but Biome is strictly better for our use case. |
| **TypeScript compiler only** | `tsc --noEmit` catches type errors but doesn't enforce style or catch logical issues (unused vars, no-unused-vars). |
| **Clawkit / Oxc** | Emerging tools, but Biome has a more mature feature set and larger community. |

## Related

- [ADR-003: Turborepo Monorepo](./003-turborepo-monorepo.md) — Biome's speed complements Turborepo's caching
