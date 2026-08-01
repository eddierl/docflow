# ---------------------------------------------------------------------------
# Build stage — install all dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/outbox-worker/package.json ./apps/outbox-worker/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

COPY . .

# ---------------------------------------------------------------------------
# Production stage — minimal runtime image with non-root user
# ---------------------------------------------------------------------------
FROM node:22-alpine

# Run as non-root user for security (CIS Docker Benchmark 1.2)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
USER appuser

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --chown=appuser:appgroup pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=appuser:appgroup apps/outbox-worker/package.json ./apps/outbox-worker/
COPY --chown=appuser:appgroup packages/*/package.json ./packages/

COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/apps/outbox-worker/node_modules ./apps/outbox-worker/node_modules
COPY --from=build --chown=appuser:appgroup /app/packages ./packages

COPY --from=build --chown=appuser:appgroup /app/apps/outbox-worker/src ./apps/outbox-worker/src

ENV NODE_ENV=production

# Health check — liveness probe on the built-in health server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["npx", "tsx", "apps/outbox-worker/src/index.ts"]
