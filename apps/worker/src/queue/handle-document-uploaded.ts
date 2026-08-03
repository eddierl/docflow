import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@docflow/aws";
import { awsEnv } from "@docflow/config";
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
    logger.info({ documentId }, "Document already claimed");
    return;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: awsEnv.S3_BUCKET,
      Key: event.payload.storageKey,
    });

    const response = await s3.send(command);

    const buffer = await response.Body?.transformToByteArray();

    logger.info(
      { documentId, mimetype: response.ContentType },
      "Processing document",
    );

    let extractedText: string | undefined;

    if (response.ContentType === "application/pdf" && buffer) {
      extractedText = await extractPdfText(buffer);
    } else if (response.ContentType === "image/png" && buffer) {
      extractedText = await extractTextFromImage(Buffer.from(buffer));
    } else {
      // Unsupported type — simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    await updateDocumentStatus(documentId, {
      status: "PROCESSED",
      extractedText,
    });

    logger.info({ documentId }, "Document processed successfully");
  } catch (error) {
    logger.error({ error, documentId }, "Failed to process document");
    await updateDocumentStatus(documentId, {
      status: "FAILED",
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function extractPdfText(pdfBuffer: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text.trim();
}
