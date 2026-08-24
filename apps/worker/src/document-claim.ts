import { db, documents } from "@docflow/database";
import { logger } from "@docflow/logger";
import { and, eq, lt, or } from "drizzle-orm";

export async function claimDocument(id: string) {
  const timeout = new Date(Date.now() - 10 * 60 * 1000);

  logger.info({ id }, "Claiming document");
  const isExists = await db
    .select({
      id: documents.id,
      status: documents.status,
      processedAt: documents.processedAt,
    })
    .from(documents)
    .where(eq(documents.id, id));
  logger.warn({ isExists }, "does this document exists?");
  const [document] = await db
    .update(documents)
    .set({
      status: "PROCESSING",
      processedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, id),
        or(
          eq(documents.status, "UPLOADED"),
          and(
            eq(documents.status, "PROCESSING"),
            lt(documents.processedAt, timeout),
          ),
        ),
      ),
    )
    .returning();

  if (document) {
    return document;
  }

  // The claim failed — let's see why.
  const [existingDocument] = await db
    .select({
      id: documents.id,
      status: documents.status,
      processedAt: documents.processedAt,
    })
    .from(documents)
    .where(eq(documents.id, id));

  if (!existingDocument) {
    console.log("Document not found", { id });
    throw new Error("document does not exists");
  } else {
    console.log("Document could not be claimed", {
      id,
      status: existingDocument.status,
      processedAt: existingDocument.processedAt,
      timeout,
    });
  }

  return null;
}
