# ADR-001: Transactional Outbox for Reliable Messaging

**Status:** Accepted  
**Date:** 2025-06-15  
**Supersedes:** —  
**Superseded by:** —

## Context

The core requirement of DocFlow is: **when a document is uploaded, it must eventually be processed**. The API writes the document to the database and S3, and a background worker must pick it up for processing (PDF extraction or OCR).

The naive approach — calling SQS `SendMessage()` directly from the API route — has a failure mode: if the database write succeeds but the SQS call fails (network blip, timeout, throttling), the document is saved but never queued. It sits in the database forever, silently lost.

The inverse failure (SQS succeeds, DB fails) is less dangerous because the worker will receive a message for a document that doesn't exist and can handle it gracefully. But the first scenario is unacceptable — it means data loss with no recovery path.

## Decision

Use the **Transactional Outbox pattern**:

1. The API inserts the document row and an outbox event row in **one database transaction**
2. The API returns `201 Created` immediately — no synchronous call to SQS
3. A separate **outbox worker** process polls the database for `PENDING` events and publishes them to SQS
4. After a successful publish, the event is marked `SENT`
5. `FOR UPDATE SKIP LOCKED` ensures multiple outbox worker instances don't process the same event

## Consequences

### Positive
- **No message loss** — If the DB transaction commits, the event is guaranteed to exist in the outbox table. The worker will eventually publish it.
- **Crash resilience** — If the outbox worker crashes mid-publish, the event stays `PENDING` and is retried on the next poll cycle.
- **Decoupled concerns** — The API doesn't need to know about SQS. It only writes to the database.
- **Idempotency by design** — The outbox event includes the document ID; the worker uses an optimistic claim lock to prevent duplicate processing.

### Negative
- **Added complexity** — An extra service (outbox worker) to run and monitor. In a production environment, this is a separate deployment target.
- **Eventual consistency** — There's a small delay (up to 5 seconds, the poll interval) between upload and the worker receiving the message. For this use case (document processing), this is acceptable.
- **Database coupling** — The outbox table lives in the same database as the application data. For a multi-tenant or microservices environment, this might be a concern.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Direct SQS call from API** | Risk of data loss if SQS call fails after DB commit |
| **SQS call before DB write** | Risk of orphaned messages if DB write fails |
| **Database triggers (pg_notify)** | Tightly couples the database to the messaging system; harder to test locally |
| **CDC (Change Data Capture) via Debezium** | Overkill for this project; adds Kafka/Connect infrastructure |
| **Sagas pattern** | More appropriate for multi-step transactions with compensating actions; overkill here |

## Related

- [ADR-005: SQS over EventBridge](./005-sqs-over-eventbridge.md)
