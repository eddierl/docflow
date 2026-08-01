# ADR-002: Floci over LocalStack for Local AWS Emulation

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

To develop and test DocFlow locally without connecting to real AWS, we need a local emulator that provides SQS and S3. The two most popular options are LocalStack and Floci.

## Decision

Use **Floci** (`floci/floci:2`) as the local AWS emulator.

## Consequences

### Positive
- **Lighter weight** — Floci focuses on SQS and S3, which are the only AWS services DocFlow uses. LocalStack emulates 70+ services, most of which we don't need.
- **Faster startup** — Smaller image, fewer services to initialise. Docker Compose starts in ~10 seconds vs. ~30 seconds for LocalStack.
- **Lower memory footprint** — Floci runs comfortably in 256 MB; LocalStack recommends 512 MB minimum.
- **Simpler configuration** — Fewer environment variables to configure.

### Negative
- **Smaller community** — LocalStack has a larger community and more documentation. If we encounter a bug, LocalStack is more likely to have a Stack Overflow thread.
- **Fewer services** — If the project expands to use DynamoDB, SNS, or Lambda locally, we'd need to switch or run both.
- **Less battle-tested** — LocalStack has been around longer and is used by more organisations in production CI pipelines.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **LocalStack Pro** | Overkill for 2 services; the free tier has limitations on concurrent requests |
| **Real AWS (dev account)** | Cost, risk of leaving resources running, slower feedback loop |
| **In-memory mocks** | Doesn't test the actual wire protocol; misses edge cases like message visibility timeouts |

## Notes

The Floci image is **pinned to `:2`** (major version) in `docker-compose.yml` to balance stability with receiving bug fixes. This mirrors how we'd pin a major version in production.

## Related

- [ADR-005: SQS over EventBridge](./005-sqs-over-eventbridge.md)
