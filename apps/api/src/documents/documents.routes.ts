import { getDocument } from "@docflow/database";
import type { FastifyInstance } from "fastify";
import { ALLOWED_CONTENT_TYPES, env } from "../config/env.js";
import { uploadFile } from "../storage/storage.service.js";
import { isUUID } from "../utils/uuid.js";
import { createDocument } from "./documents.service.js";

/** Human-readable label for the allowed content types limit */
const ALLOWED_TYPES_DISPLAY = ALLOWED_CONTENT_TYPES.join(", ");

/** Format bytes to a human-readable string */
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${bytes} B`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export async function documentsRoutes(app: FastifyInstance) {
  /* ------------------------------------------------------------------ */
  /*  GET /documents/:id — retrieve document status & extracted text    */
  /* ------------------------------------------------------------------ */
  app.get(
    "/documents/:id",
    {
      schema: {
        summary: "Get document by ID",
        description:
          "Retrieve the processing status and extracted text for a specific document. Returns the document metadata including status (UPLOADED, PROCESSING, PROCESSED, FAILED).",
        tags: ["Documents"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Document UUID",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              filename: { type: "string" },
              status: {
                type: "string",
                enum: ["UPLOADED", "PROCESSING", "PROCESSED", "FAILED"],
              },
              extractedText: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              processedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
              lastError: { type: "string", nullable: true },
            },
          },
          400: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          404: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };

      if (!isUUID(params.id)) {
        return reply.status(400).send({
          error: "Invalid document ID. Must be a valid UUID.",
        });
      }

      const document = await getDocument(params.id);

      if (!document) {
        return reply.status(404).send({
          error: "Document not found",
        });
      }

      return document;
    },
  );

  /* ------------------------------------------------------------------ */
  /*  POST /documents — upload a document for async processing          */
  /* ------------------------------------------------------------------ */
  app.post(
    "/documents",
    {
      schema: {
        summary: "Upload a document",
        description: [
          "Upload a document (PDF, PNG, JPEG, TIFF, or plain text) for asynchronous processing.",
          "",
          "The file is stored in S3 and queued for background processing. Use `GET /documents/:id`",
          "to check the processing status. Documents are processed using PDF text extraction",
          "or OCR (Tesseract) depending on the file type.",
        ].join("\n"),
        tags: ["Documents"],
        consumes: ["multipart/form-data"],
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              filename: { type: "string" },
              status: { type: "string", enum: ["UPLOADED"] },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          413: {
            type: "object",
            properties: { error: { type: "string" } },
          },
          500: {
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          error: "File required. Send a multipart form with a 'file' field.",
        });
      }

      /* --- Content type validation --- */
      if (
        !ALLOWED_CONTENT_TYPES.includes(
          file.mimetype as (typeof ALLOWED_CONTENT_TYPES)[number],
        )
      ) {
        return reply.status(400).send({
          error: `Unsupported file type '${file.mimetype}'. Allowed: ${ALLOWED_TYPES_DISPLAY}.`,
        });
      }

      /* --- File size validation --- */
      // @fastify/multipart enforces the limit at parse time, but we double-check
      // the buffer size as a safety net
      const buffer = await file.toBuffer();
      if (buffer.byteLength > env.MAX_FILE_SIZE) {
        return reply.status(413).send({
          error: `File too large. Maximum size is ${formatBytes(env.MAX_FILE_SIZE)}.`,
        });
      }

      /* --- Store and create document --- */
      const key = `uploads/${Date.now()}-${file.filename}`;

      try {
        await uploadFile(key, buffer, file.mimetype);
      } catch (error) {
        request.log.error({ error }, "Failed to upload file to S3");
        return reply.status(500).send({
          error: "Failed to store file. Please try again.",
        });
      }

      const document = await createDocument({
        filename: file.filename,
        storageKey: key,
      });

      return reply.status(201).send(document);
    },
  );
}
