import { db, documents, getDocument } from "@docflow/database";
import { and, eq, lt, or, sql } from "drizzle-orm";

export async function claimDocument(id: string) {
  const timeout = new Date(Date.now() - 10 * 60 * 1000);

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

  return document ?? null;
}

export async function markDocumentFailed(id: string, error: string) {
  const [document] = await db
    .update(documents)
    .set({
      status: "FAILED",
      lastError: error,
    })
    .where(eq(documents.id, id))
    .returning();

  return document;
}

export async function releaseDocumentForRetry(id: string, error: string) {
  const [document] = await db
    .update(documents)
    .set({
      status: "UPLOADED",
      retryCount: sql`${documents.retryCount} + 1`,
      lastError: error,
      processedAt: null,
    })
    .where(eq(documents.id, id))
    .returning();

  return document;
}

const MAX_RETRIES = 3;
export async function handleProcessingError(
  documentId: string,
  error: unknown,
) {
  const document = await getDocument(documentId);

  if (!document) return;

  const message = error instanceof Error ? error.message : String(error);

  if (document.retryCount >= MAX_RETRIES) {
    await markDocumentFailed(documentId, message);

    return;
  }

  await releaseDocumentForRetry(documentId, message);
}
