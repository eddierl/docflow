import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
import { updateDocumentStatus } from "@docflow/database";
import { type DocumentUploadedEvent, parseEvent } from "@docflow/events";
import { logger } from "@docflow/logger";

let running = true;

export function stopConsumer() {
  running = false;
}

export async function startConsumer() {
  logger.info("Worker listening...");

  while (running) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: awsEnv.SQS_QUEUE_URL,

        MaxNumberOfMessages: 1,

        WaitTimeSeconds: 10,
      }),
    );

    const messages = response.Messages ?? [];

    for (const message of messages) {
      if (!message.Body) {
        logger.error({ message }, "Something bad has happens");
        break;
      }

      logger.info(message, "Received:");

      const raw = JSON.parse(message.Body);
      const validatedEvent = parseEvent(raw);

      switch (validatedEvent.eventType) {
        case "DOCUMENT_UPLOADED":
          await handleDocumentUploaded(validatedEvent);
          break;
      }

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: awsEnv.SQS_QUEUE_URL,

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
