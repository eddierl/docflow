import { SendMessageCommand } from "@aws-sdk/client-sqs";

import { db, outboxEvents } from "@docflow/database";
import { eq } from "drizzle-orm";

import { sqs } from "./sqs.js";



export async function publishEvents() {
	
	const events = await db
		.select()
		.from(outboxEvents)
		.where(eq(outboxEvents.status, "PENDING"));

	for (const event of events) {
		console.log(
  "Publishing event",
  event.id,process.env.SQS_QUEUE_URL
);
console.log("Sending to SQS", {
  queue: process.env.SQS_QUEUE_URL,
  event: event.id,
});
		const r = await sqs.send(
			new SendMessageCommand({
				QueueUrl: process.env.SQS_QUEUE_URL,

				MessageBody: JSON.stringify({
					type: event.type,
					...event.payload,
				}),
			}),
		);
		console.log("SQS send completed", event.id);
		console.log("SQS response", r);

		await db
			.update(outboxEvents)
			.set({
				status: "SENT",
			})
			.where(eq(outboxEvents.id, event.id));
	}
}
