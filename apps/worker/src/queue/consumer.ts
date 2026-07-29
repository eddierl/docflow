import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { updateDocumentStatus } from "@docflow/database";
import { type DocumentUploadedEvent, parseEvent } from "@docflow/events";
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
      if (!message.Body) {
        console.error("Something bad has happens", { message });
        break;
      }

      console.log("Received:", message.Body);

      const raw = JSON.parse(message.Body);
      const validatedEvent = parseEvent(raw);

      switch (validatedEvent.eventType) {
        case "DOCUMENT_UPLOADED":
          await handleDocumentUploaded(validatedEvent);
          break;
      }

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: env.SQS_QUEUE_URL,

          ReceiptHandle: message.ReceiptHandle!,
        }),
      );
    }
  }
}

export async function handleDocumentUploaded(event: DocumentUploadedEvent) {
  await updateDocumentStatus(event.payload.documentId, {
    status: "PROCESSING",
  });

  // TODO: process the document.
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await updateDocumentStatus(event.payload.documentId, {
    status: "PROCESSED",
  });
}
