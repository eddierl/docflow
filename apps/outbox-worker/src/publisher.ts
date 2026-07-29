import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
import { db, outboxEvents } from "@docflow/database";
import { parseEvent } from "@docflow/events";
import { eq } from "drizzle-orm";

export async function publishPendingEvents() {
  const events = await db
    .select()
    .from(outboxEvents)
    .where(eq(outboxEvents.status, "PENDING"));

  for (const event of events) {
    console.log("Sending to SQS", {
      queue: awsEnv.SQS_QUEUE_URL,
      event: event.id,
    });

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
    console.log("SQS send completed", event.id);

    await db
      .update(outboxEvents)
      .set({
        status: "SENT",
      })
      .where(eq(outboxEvents.id, event.id));
  }
}
