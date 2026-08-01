import { awsEnv } from "@docflow/config";
import { logger } from "@docflow/logger";
import { handleDeadLetterMessage } from "./handle-dlm.js";
import { handleDocumentUploaded } from "./handle-document-uploaded.js";
import { parseMessage } from "./parse-message.js";
import { deleteMessage, receiveMessages } from "./sqs.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let running = true;

export function stopConsumer() {
  running = false;
}

const MAIN_QUEUE = awsEnv.SQS_QUEUE_URL;
const MAIN_DLQ = `${MAIN_QUEUE}-dlq`;

export async function startConsumer() {
  logger.info("Worker listening...");

  while (running) {
    const messages = await receiveMessages(MAIN_QUEUE);

    for (const message of messages) {
      try {
        const event = parseMessage(message);
        switch (event.eventType) {
          case "DOCUMENT_UPLOADED":
            await handleDocumentUploaded(event);
            break;
        }

        await deleteMessage(MAIN_QUEUE, message);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(
            {
              err: error.message,
              stack: error.stack,
              messageId: message.MessageId,
            },
            "Processing failed",
          );
        } else {
          logger.error(
            { error, messageId: message.MessageId },
            "Processing failed",
          );
        }
      }
    }

    const dlq = await receiveMessages(MAIN_DLQ);
    for (const message of dlq) {
      try {
        await handleDeadLetterMessage(message);
        await deleteMessage(MAIN_DLQ, message);
      } catch (error) {
        logger.error(
          { error, messageId: message.MessageId },
          "Failed handling DLQ message",
        );
      }
    }

    // Backoff when no messages were received to avoid CPU spin.
    // SQS long polling (10s WaitTimeSeconds) handles this in production,
    // but local Floci may return immediately with empty results.
    if (messages.length === 0 && dlq.length === 0) {
      await sleep(1000);
    }
  }
}
