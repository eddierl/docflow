import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
import { db, outboxEvents } from "@docflow/database";
import { parseEvent } from "@docflow/events";
import { logger } from "@docflow/logger";
import { eq, sql } from "drizzle-orm";

export async function publishPendingEvents() {
  // Use FOR UPDATE SKIP LOCKED to prevent multiple outbox workers
  // from processing the same event simultaneously
  const lockedEvents = await db.execute(
    sql`SELECT * FROM outbox_events WHERE status = 'PENDING' LIMIT 10 FOR UPDATE SKIP LOCKED`,
  );

  if (!lockedEvents || lockedEvents.length === 0) {
    return;
  }

  for (const event of lockedEvents as unknown as (typeof outboxEvents.$inferSelect)[]) {
    try {
      logger.info(
        {
          queue: awsEnv.SQS_QUEUE_URL,
          eventId: event.id,
        },
        "Sending event to SQS",
      );

      const message = {
        eventType: event.type,
        payload: event.payload,
      };
      const validatedEvent = parseEvent(message);

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: awsEnv.SQS_QUEUE_URL,
          MessageBody: JSON.stringify(validatedEvent),
        }),
      );

      await db
        .update(outboxEvents)
        .set({
          status: "SENT",
          processedAt: new Date(),
        })
        .where(eq(outboxEvents.id, event.id));

      logger.info({ eventId: event.id }, "Event published successfully");
    } catch (error) {
      logger.error({ error, eventId: event.id }, "Failed to publish event");
      // Leave as PENDING so it can be retried on the next cycle
    }
  }
}
