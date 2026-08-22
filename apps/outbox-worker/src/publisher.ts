import { PublishCommand } from "@aws-sdk/client-sns";
import { sns } from "@docflow/aws";
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
    logger.info(
      {
        topicArn: awsEnv.SNS_TOPIC_ARN,
        event: event.id,
      },
      "Sending to SNS",
    );

    const message = {
      eventType: event.type,
      payload: event.payload,
    };
    const validatedEvent = parseEvent(message);

    await sns.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify(validatedEvent),
      }),
    );
    logger.info({ id: event.id }, "SNS send completed");

    await db
      .update(outboxEvents)
      .set({
        status: "SENT",
      })
      .where(eq(outboxEvents.id, event.id));
  }
}
