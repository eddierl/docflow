import { eq } from "drizzle-orm";

import { db } from "./client.js";
import { documents } from "./schema.js";

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
  },
) {
  const [document] = await db
    .update(documents)
    .set(data)
    .where(eq(documents.id, id))
    .returning();

  return document;
}
