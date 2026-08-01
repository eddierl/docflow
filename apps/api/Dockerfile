# ---------------------------------------------------------------------------
# Build stage — install all dependencies (including devDependencies for tsx)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifest files first (better layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install all dependencies (needs devDeps for tsx)
RUN pnpm install --frozen-lockfile

# Copy full source (tsx needs .ts files)
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

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifest files
COPY --chown=appuser:appgroup pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=appuser:appgroup apps/api/package.json ./apps/api/
COPY --chown=appuser:appgroup packages/*/package.json ./packages/

# Install production dependencies + tsx (needed to run .ts files)
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=appuser:appgroup /app/packages ./packages

# Copy application source
COPY --from=build --chown=appuser:appgroup /app/apps/api/src ./apps/api/src

# Production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npx", "tsx", "apps/api/src/index.ts"]
