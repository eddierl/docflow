import type { FastifyInstance } from "fastify";
import { enqueueDocumentProcessing } from "../queue/document.queue.js";
import { uploadFile } from "../storage/storage.service.js";
import { createDocument } from "./documents.service.js";

export async function documentsRoutes(app: FastifyInstance) {
	app.post("/documents", async (request, reply) => {
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

		if (!document) {
			return reply.status(500).send("something went wrong");
		}
		await enqueueDocumentProcessing({
			documentId: document.id,
			storageKey: key,
		});

		return reply.status(201).send(document);
	});
}
