import { eq } from "drizzle-orm";

import { db } from "./client.js";
import { documents } from "./schema.js";

export async function updateDocumentStatus(
  id: string,
  data: { status: typeof documents.$inferSelect.status },
) {
  const [document] = await db
    .update(documents)
    .set(data)
    .where(eq(documents.id, id))
    .returning();

  return document;
}
