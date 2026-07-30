import { and, eq } from "drizzle-orm";
import { db, documents } from "../index.js";

export async function claimDocument(id: string) {
  const [document] = await db
    .update(documents)
    .set({
      status: "PROCESSING",
    })
    .where(and(eq(documents.id, id), eq(documents.status, "UPLOADED")))
    .returning();

  return document ?? null;
}
