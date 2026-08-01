# Troubleshooting

Common issues and their solutions. If you're setting this up for the first time, start with the **Quick Diagnostics** section.

---

## Quick Diagnostics

Run these checks in order to isolate the problem:

```bash
# 1. Are infrastructure services running?
docker compose ps

# 2. Check logs for a specific service
docker compose logs api
docker compose logs worker
docker compose logs outbox-worker

# 3. Test database connectivity
docker exec docflow-postgres pg_isready -U docflow

# 4. Test Floci (local AWS) is responding
curl -s http://localhost:4566

# 5. Test the API health endpoint
curl http://localhost:3000/health
```

---

## Common Issues

### "Connection refused" on port 3000 (API won't start)

**Cause:** PostgreSQL isn't ready yet, or the `DATABASE_URL` is wrong.

**Fix:**
```bash
# Check if PostgreSQL is healthy
docker compose ps postgres

# Wait for it to become healthy (the healthcheck takes ~10s)
sleep 15
docker compose restart api
```

### "Cannot connect to endpoint" / Floci errors

**Cause:** Floci hasn't finished starting, or Terraform resources haven't been provisioned.

**Fix:**
```bash
# Check Floci is running
docker compose ps floci

# Re-provision Terraform resources
pnpm run terraform:apply

# If using Docker, ensure AWS_ENDPOINT points to Floci
# In docker-compose.yml, this is already set to http://floci:4566
```

### Documents stuck in "UPLOADED" status

**Cause:** The outbox worker isn't publishing events to SQS.

**Fix:**
```bash
# Check outbox worker logs
docker compose logs outbox-worker

# Verify the outbox_events table has PENDING events
docker exec -it docflow-postgres psql -U docflow -c "SELECT * FROM outbox_events WHERE status = 'PENDING';"

# Restart the outbox worker
docker compose restart outbox-worker
```

### Documents stuck in "PROCESSING" status

**Cause:** The worker crashed or is stuck processing.

**Fix:**
```bash
# Check worker logs
docker compose logs worker

# Reset stuck documents back to UPLOADED
docker exec -it docflow-postgres psql -U docflow -c "UPDATE documents SET status = 'UPLOADED' WHERE status = 'PROCESSING' AND updated_at < NOW() - INTERVAL '10 minutes';"
```

### OCR fails with "eng.traineddata not found" (Docker only)

**Cause:** The Tesseract.js language data file isn't in the container.

**Fix:** The worker Dockerfile now copies `eng.traineddata` in the production stage. Rebuild:
```bash
docker compose build worker
docker compose up worker
```

### "EACCES: permission denied" in Docker containers

**Cause:** File permissions after adding non-root user.

**Fix:** Rebuild the container (the Dockerfiles now use `--chown=appuser:appgroup`):
```bash
docker compose build
docker compose up
```

### Terraform errors on first run

**Cause:** Terraform state hasn't been initialized, or Floci isn't running.

**Fix:**
```bash
# Ensure Floci is running
docker compose ps floci

# Initialize Terraform
pnpm run terraform:init

# Apply
pnpm run terraform:apply
```

### pnpm install fails with "frozen lockfile" error

**Cause:** The lockfile is out of sync with `package.json`.

**Fix:**
```bash
# Regenerate the lockfile (only do this if you've changed dependencies)
pnpm install

# In CI, this should never happen. If it does, check your local changes.
```

### Pre-commit hooks not running

**Cause:** Husky isn't installed or the `.husky` directory is missing.

**Fix:**
```bash
# Reinstall hooks
pnpm install

# Verify husky is set up
ls -la .husky/
```

### E2E tests fail with timeout

**Cause:** The async pipeline hasn't finished processing before the test checks.

**Fix:** E2E tests use `expect.poll()` with a 30-second timeout. If processing takes longer:
- Check worker logs for errors: `docker compose logs worker --tail=50`
- Increase the polling timeout in the test file
- Ensure all infrastructure services are healthy

---

## Clean Slate

If nothing else works, reset everything:

```bash
# Stop all containers
docker compose down -v  # -v removes volumes (deletes DB data!)

# Start fresh
docker compose build
docker compose up -d

# Wait for infrastructure
sleep 20

# Provision resources
pnpm run terraform:init
pnpm run terraform:apply

# Run migrations
pnpm run db:migrate

# Start app services
docker compose up -d api worker outbox-worker
```

---

## Still stuck?

Check the [GitHub Issues](https://github.com/eddierl/docflow/issues) page, or reach out directly. This is a portfolio project — I'm happy to discuss any of the architecture or implementation decisions.
