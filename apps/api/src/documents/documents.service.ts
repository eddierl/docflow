import { db,documents, outboxEvents } from "@docflow/database";


export async function createDocument(input: {
  filename: string;
  storageKey: string;
}) {
  const result = await db.transaction(async (tx) => {
    const [document] = await tx
      .insert(documents)
      .values({
        filename: input.filename,
        storageKey: input.storageKey,
        status: "UPLOADED",
      })
      .returning();

    if (!document?.id) {
      throw "no document id";
    }

    await tx.insert(outboxEvents).values({
      type: "DOCUMENT_UPLOADED",

      payload: {
        documentId: document.id,
        storageKey: input.storageKey,
      },
    });

    return document;
  });

  return result;
}
