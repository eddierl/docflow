import type { Message } from "@aws-sdk/client-sqs";
import { updateDocumentStatus } from "@docflow/database";
import { parseEvent } from "@docflow/events";

export async function handleDeadLetterMessage(message: Message) {
  if (!message.Body) {
    throw new Error("DLQ message has no body");
  }

  const raw = JSON.parse(message.Body);

  const event = parseEvent(raw);

  switch (event.eventType) {
    case "DOCUMENT_UPLOADED":
      await updateDocumentStatus(event.payload.documentId, {
        status: "FAILED",
      });
      break;
  }
}
