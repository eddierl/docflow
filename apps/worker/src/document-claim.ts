import { db, documents } from "@docflow/database";
import { and, eq } from "drizzle-orm";

export async function claimDocument(id: string) {
  const [document] = await db
    .update(documents)
    .set({
      status: "PROCESSING",
      processedAt: new Date(),
    })
    .where(and(eq(documents.id, id), eq(documents.status, "UPLOADED")))
    .returning();

  return document ?? null;
}
