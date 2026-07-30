import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { s3, sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
import { updateDocumentStatus } from "@docflow/database";
import { type DocumentUploadedEvent, parseEvent } from "@docflow/events";
import { logger } from "@docflow/logger";
import { PDFParse } from "pdf-parse";
import { claimDocument } from "../document-claim.js";
import { extractTextFromImage } from "./ocr.js";

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

const BUCKET = "docflow-uploads";

export async function handleDocumentUploaded(event: DocumentUploadedEvent) {
  const { documentId } = event.payload;
  const document = await claimDocument(documentId);

  if (!document) {
    logger.info(
      {
        documentId: event.payload.documentId,
      },
      "Document already claimed",
    );

    return;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: event.payload.storageKey,
  });
  const response = await s3.send(command);

  if (response.ContentType === "application/pdf") {
    const pdfBuffer = await response.Body?.transformToByteArray();

    if (pdfBuffer) {
      const extractedText = await getExtractText(pdfBuffer);
      await updateDocumentStatus(event.payload.documentId, {
        extractedText,
      });
    }
  } else if (response.ContentType === "image/png") {
    const buffer = await response.Body?.transformToByteArray();
    if (buffer) {
      const extractedText = await extractTextFromImage(Buffer.from(buffer));
      await updateDocumentStatus(event.payload.documentId, {
        extractedText,
      });
    }
  } else {
    // TODO: process the document.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  await updateDocumentStatus(event.payload.documentId, {
    status: "PROCESSED",
  });
}

const getExtractText = async (pdfBuffer: Uint8Array) => {
  const data = new PDFParse(pdfBuffer);
  const extracted = await data.getText();
  return extracted.text.trim();
};
