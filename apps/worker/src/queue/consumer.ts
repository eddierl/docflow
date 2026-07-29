import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";
import { sqs } from "./sqs.js";

export async function startConsumer() {
  console.log("Worker listening...");

  while (true) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,

        MaxNumberOfMessages: 1,

        WaitTimeSeconds: 10,
      }),
    );

    const messages = response.Messages ?? [];

    for (const message of messages) {
      console.log("Received:", message.Body);

      await processMessage(message.Body!);

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: env.SQS_QUEUE_URL,

          ReceiptHandle: message.ReceiptHandle!,
        }),
      );
    }
  }
}

async function processMessage(body: string) {
  const payload = JSON.parse(body);

  console.log("Processing document:", payload.documentId);
}
