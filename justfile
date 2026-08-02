# ---------------------------------------------------------------------------
# DocFlow — Developer Commands
# ---------------------------------------------------------------------------
# Run `just` to see all available commands.
# Requires: https://just.systems
# ---------------------------------------------------------------------------

# -- Setup --

setup:
    """Install dependencies and set up the development environment."""
    pnpm install
    just hooks

hooks:
    """Install pre-commit hooks (Husky)."""
    pnpm run prepare

# -- Infrastructure --

infra:
    """Start local infrastructure (PostgreSQL + Floci)."""
    pnpm run infra

infra-down:
    """Stop local infrastructure."""
    pnpm run infra:down

infra-logs:
    """Follow infrastructure logs."""
    pnpm run infra:logs

infra-reset:
    """Stop infrastructure and destroy volumes (nukes local DB data)."""
    pnpm run infra:reset

terraform-init:
    """Initialise Terraform (first-time setup)."""
    pnpm run terraform:init

terraform-plan:
    """Preview infrastructure changes."""
    pnpm run terraform:plan

terraform-apply:
    """Apply infrastructure changes (creates SQS queues, S3 buckets)."""
    pnpm run terraform:apply

db-migrate:
    """Run database migrations."""
    pnpm run db:migrate

bootstrap: setup infra terraform-init terraform-apply db-migrate
    """Full bootstrap: install deps, start infra, provision AWS resources, run migrations."""

# -- Development --

dev:
    """Start all services (API + Worker + Outbox Worker)."""
    pnpm run dev

dev-api:
    """Start only the API service."""
    pnpm --filter @docflow/api dev

dev-worker:
    """Start only the document processing worker."""
    pnpm --filter @docflow/worker dev

dev-outbox:
    """Start only the outbox worker."""
    pnpm --filter @docflow/outbox-worker dev

# -- Quality --

typecheck:
    """TypeScript type checking across all packages."""
    pnpm run typecheck

lint:
    """Biome linting."""
    pnpm run lint

lint-fix:
    """Fix auto-fixable lint issues."""
    pnpm run lint:fix

format:
    """Format all files with Biome."""
    pnpm run format

# -- Testing --

test:
    """Run unit tests (safe for CI)."""
    pnpm run test

test-e2e:
    """Run E2E tests (requires infra + app running)."""
    pnpm run test:e2e

test-all:
    """Run all tests (unit + E2E, local only)."""
    pnpm run test:all

# -- Docker --

docker-build:
    """Build all service containers."""
    docker compose build

docker-up:
    """Build and run the full stack in containers."""
    docker compose build && docker compose up

docker-down:
    """Stop all containers."""
    docker compose down

docker-logs:
    """Follow container logs."""
    docker compose logs -f

# -- Health Checks --

wait-infra:
    """Wait for infrastructure services (PostgreSQL + Floci) to be ready."""
    ./scripts/wait-for-it.sh localhost:5432 -t 30
    ./scripts/wait-for-it.sh localhost:4566 -t 30

health-api:
    """Check API health (liveness)."""
    curl -s http://localhost:3000/health | jq

health-api-ready:
    """Check API readiness (DB connectivity)."""
    curl -s http://localhost:3000/ready | jq

health-worker:
    """Check worker health (liveness)."""
    curl -s http://localhost:3002/health | jq

health-outbox:
    """Check outbox worker health (liveness)."""
    curl -s http://localhost:3001/health | jq

health-all: health-api health-api-ready health-worker health-outbox
    """Check all service health endpoints."""

# -- Quick Start --

start: bootstrap dev:wait
    """Full quick start: setup everything and begin developing."""

dev:wait: wait-infra dev
    """Wait for infrastructure, then start all services."""

play:
    """Upload a test PDF and check its status."""
    echo "Upload a PDF:"
    echo '  curl -X POST http://localhost:3000/documents -F "file=@/path/to/document.pdf"'
    echo ""
    echo "Check status:"
    echo '  curl http://localhost:3000/documents/<document-id>'
    echo ""
    echo "Open Swagger UI:"
    echo '  open http://localhost:3000/docs'
