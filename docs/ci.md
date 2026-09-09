# CI: How the `test` Job Works

`.github/workflows/ci.yml` runs two jobs: **Quality Checks** (lint + typecheck) and **Unit Tests** (the full `test` job, which includes the E2E suite). This page documents the second, which spins up the whole system the same way you would locally — with one difference: the **document worker runs as an ECS task emulated by Floci**, not as a local `tsx` process.

## Why run the worker on ECS in CI?

Locally, the worker is documented to run either on the machine or in an ECS container (`pnpm dev:local` / `pnpm dev:docker`). CI takes the container path so the e2e run exercises the same deployment shape as `dev:docker` — the worker's environment, image, and ECS service all come from `terraform/ecs.tf` and `Dockerfile.worker` instead of a second, hand-maintained startup path.

## The flow, step by step

1. **Configure Docker for the Floci registry** — Floci's registry speaks plain HTTP on `127.0.0.1:5100`, so the step *merges* `127.0.0.1:5100` and `000000000000.dkr.ecr.us-east-1.localhost:5100` into the runner's `/etc/docker/daemon.json` `insecure-registries` (merging, not replacing, so runner defaults like `add-host` survive), maps the `*.localhost` ECR hostname to `127.0.0.1` in `/etc/hosts` (glibc doesn't resolve `*.localhost`), restarts the Docker daemon, and brings the job's service containers (Postgres) back up.
2. **Start Floci** — one container publishing `4566` (AWS API) and `5100` (registry), with the Docker socket mounted, `FLOCI_DEFAULT_REGION=us-east-1`.
3. **Wait for Floci** — polls `/_health` on 4566 and `/v2/` on 5100.
4. **Provision ECR repository** — `terraform apply -target=aws_ecr_repository.worker`, then exports the repo URL and a per-run image tag (`e2e-<run id>-<attempt>`; a unique tag sidesteps Floci's digest pinning of `:latest`) to `$GITHUB_ENV`.
5. **Build & push worker image** — `docker build -f Dockerfile.worker` tagged two ways: `127.0.0.1:5100/docflow-worker:<tag>` (for `docker push`) and the exact `repository_url` from Terraform (so the task definition's image name matches the local image store if Floci resolves images from there). Then `aws ecr get-login-password` + `docker login` + push.
6. **Provision local infra** — full `terraform apply` against Floci (queues, DLQ, ECR, ECS task definition + `docflow-worker` service on the `docflow` cluster). `TF_VAR_worker_image_tag` is the per-run tag; `TF_VAR_worker_database_name=docflow-test` matches the job's Postgres service.
7. **Detect worker host address** — the task container must reach the runner's published ports (Postgres 5432, Floci 4566). Floci may place the container in different network modes, so the step finds the worker container, inspects its `NetworkMode`, probes `host.docker.internal` from that network with an `alpine` one-shot, and falls back to `localhost` (host mode) or the network gateway (bridge).
8. **Re-apply worker with detected host** *(only if the detected host differs from the task definition's `host.docker.internal` default)* — updates the task definition + service and does the Floci digest-pin workaround: `desired-count 0` → wait → `1` → wait, the same restart `pnpm worker:docker:deploy` performs locally.
9. **Run database migrations, start services, run tests** — API and outbox-worker start locally (`tsx`), the document worker is expected to already be running as the ECS task. The step hard-gates on `aws ecs describe-services ... runningCount == 1` (failing the run with `docker ps -a` + `docker logs floci` on timeout) and does a *non-gating* best-effort curl of the worker's `:3001` port, since Floci may not publish task ports to the host.

## Failure diagnostics

If the worker task never reaches `running`, the failing step prints `docker ps -a` and the last 50 lines of `docker logs floci`. Useful things to look for there: image pull errors (registry/TLS), crash-looping task containers, and which network the task was created on.

## Things that are intentional, not bugs

- **`docflow-test` as the worker database name** in CI: the task definition uses `${var.worker_database_name}` so CI can point the containerized worker at the job's Postgres DB while local dev keeps the `docflow` default in `terraform/variables.tf`.
- **The registry on `127.0.0.1:5100` + insecure registries**: Floci's registry is plain-HTTP, and the local dev scripts already push there (see the [registry quirk](../README.md#two-floci-quirks-to-know-about) — the same address, same flow).
- **No teardown steps**: nothing removes Floci, the Terraform state, or the images after the run. GitHub-hosted runners are ephemeral, so the whole environment dies with the runner; there is no long-lived state to clean up.
