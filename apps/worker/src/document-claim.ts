import { db, documents } from "@docflow/database";
import { logger } from "@docflow/logger";
import { and, eq, lt, or } from "drizzle-orm";

export async function claimDocument(id: string) {
  const timeout = new Date(Date.now() - 10 * 60 * 1000);

  logger.info({ id }, "Claiming document");
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
