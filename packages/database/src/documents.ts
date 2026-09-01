import { eq } from "drizzle-orm";

import { db } from "./client.js";
import { documents, idempotencyKeys } from "./schema.js";

export async function getDocument(id: string) {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id));

  return document;
}

export async function updateDocumentStatus(
  id: string,
  data: {
    status?: typeof documents.$inferSelect.status;
    extractedText?: typeof documents.$inferSelect.extractedText;
    lastError?: typeof documents.$inferSelect.lastError;
  },
) {
  const [document] = await db
    .update(documents)
    .set(data)
    .where(eq(documents.id, id))
    .returning();

  return document;
}

export const getIdempotencyByKey = async (key: string) => {
  const [document] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key));

  return document;
};

export const createIdempotency = async (key: string) => {
  const now = Date.now();
  const [document] = await db.insert(idempotencyKeys).values({
    key,
    completedAt: new Date(now),
    expiresAt: new Date(now + 24 * 60 * 60 * 1000),
  });

  return document;
};
