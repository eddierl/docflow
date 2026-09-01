import {
  createIdempotency,
  getDocument,
  getIdempotencyByKey,
} from "@docflow/database";
import { logger } from "@docflow/logger";
import type { FastifyInstance } from "fastify";
import { uploadFile } from "../storage/storage.service.js";
import { createDocument } from "./documents.service.js";

export async function documentsRoutes(app: FastifyInstance) {
  app.get("/documents/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    const document = await getDocument(id);

    if (!document) {
      return reply.status(404).send({
        error: "Document not found",
      });
    }

    return document;
  });

  app.post("/documents", async (request, reply) => {
    const idempotencyKey = request.headers["idempotency-key"];
    if (!idempotencyKey) {
      return reply.status(400).send({ message: "should have idempotencyKey" });
    }
    logger.warn({ idempotencyKey }, "idempotencyKey");
    const idempotency = await getIdempotencyByKey(idempotencyKey as string);

    if (idempotency) {
      return idempotency;
    }

    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        error: "File required",
      });
    }

    const buffer = await file.toBuffer();

    const key = `uploads/${Date.now()}-${file.filename}`;

    await uploadFile(key, buffer, file.mimetype);

    const document = await createDocument({
      filename: file.filename,
      storageKey: key,
    });

    await createIdempotency(document.id);

    logger.info({ document }, "document");
    return reply.status(201).send(document);
  });
}
