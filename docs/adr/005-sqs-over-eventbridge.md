# ADR-005: SQS for Async Messaging over EventBridge

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

DocFlow needs a message queue to decouple the API (which accepts uploads) from the worker (which processes documents). On AWS, the two primary options are SQS (Simple Queue Service) and EventBridge.

## Decision

Use **SQS** as the message queue, with a single queue for document processing events and a Dead Letter Queue (DLQ) for failed messages.

## Consequences

### Positive
- **Simple mental model** — SQS is a classic queue: producer sends, consumer receives. EventBridge's event-bus model adds a layer of indirection that isn't needed here.
- **Built-in retry and DLQ** — SQS automatically retries failed messages (up to `maxReceiveCount`) and moves them to a DLQ. No extra configuration needed.
- **Floci support** — The local AWS emulator (Floci) has excellent SQS support, making local development faithful to production.
- **Cost effective** — SQS is cheap for our expected volume. EventBridge has a different pricing model that's harder to predict.
- **Long polling** — SQS supports up to 20 seconds of server-side long polling, reducing empty poll responses and AWS costs.

### Negative
- **No event routing** — EventBridge can route events to multiple targets based on rules. SQS is a single consumer queue. If we need fan-out later, we'd add SNS on top.
- **FIFO vs standard** — SQS FIFO queues guarantee ordering but have lower throughput. We use standard queues and handle idempotency at the application level.
- **Visibility timeout tuning** — Getting the visibility timeout right is important. Too short and a message is re-processed before the worker finishes; too long and failed messages sit in the queue longer.

## Queue Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Visibility Timeout | 30 seconds | Enough time for PDF extraction + DB update |
| Message Retention | 4 days | AWS default; sufficient for dev |
| Max Receive Count | 3 | After 3 failures, move to DLQ |
| Long Poll Wait Time | 10 seconds | Balance between latency and empty polls |

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **EventBridge** | Overkill for a single producer → single consumer flow. Adds complexity without benefit. |
| **SNS + SQS (fan-out)** | Useful for multiple consumers, but we have one worker. Can add later if needed. |
| **Redis Streams** | Would require running Redis in addition to PostgreSQL. SQS is already available via Floci/AWS. |
| **Database polling only** | Works (and is what the outbox worker does), but SQS provides backpressure and visibility timeout management for free. |

## Related

- [ADR-001: Transactional Outbox](./001-transactional-outbox.md) — The outbox worker publishes to this SQS queue
- [ADR-002: Floci over LocalStack](./002-floci-over-localstack.md) — Floci emulates SQS locally
