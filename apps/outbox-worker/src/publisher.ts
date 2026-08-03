import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
import { db, outboxEvents } from "@docflow/database";
import { parseEvent } from "@docflow/events";
import { logger } from "@docflow/logger";
import { eq } from "drizzle-orm";

export async function publishPendingEvents() {
  const events = await db
    .select()
    .from(outboxEvents)
    .where(eq(outboxEvents.status, "PENDING"));

  for (const event of events) {
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
