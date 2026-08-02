import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@docflow/aws";
import { updateDocumentStatus } from "@docflow/database";
import type { DocumentUploadedEvent } from "@docflow/events";
import { logger } from "@docflow/logger";
import { PDFParse } from "pdf-parse";
import { claimDocument } from "../document-claim.js";
import { extractTextFromImage } from "./ocr.js";

export async function handleDocumentUploaded(event: DocumentUploadedEvent) {
  const { documentId } = event.payload;
  const document = await claimDocument(documentId);

  if (!document) {
    logger.info(
      {
        documentId,
      },
      "Document already claimed",
    );
    throw new Error(`Document ${documentId} is already being processed`);
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: event.payload.storageKey,
  });

  const response = await s3.send(command);

  const buffer = await response.Body?.transformToByteArray();

  logger.info(
    { documentId, mimetype: response.ContentType },
    "Handle document",
  );

  if (response.ContentType === "application/pdf") {
    if (buffer) {
      const extractedText = await getExtractText(buffer);
      await updateDocumentStatus(event.payload.documentId, {
        extractedText,
      });
    }
  } else if (response.ContentType === "image/png") {
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

  logger.info({ documentId }, "Handled document");
}
export const getExtractText = async (pdfBuffer: Uint8Array) => {
  const data = new PDFParse(pdfBuffer);
  const extracted = await data.getText();
  return extracted.text.trim();
};
export const BUCKET = "docflow-uploads";
