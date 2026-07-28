import { db } from "../database/client.js";
import { documents } from "../database/schema.js";


export async function createDocument(input: {
  filename: string;
  storageKey: string;
}) {
  const [document] = await db
    .insert(documents)
    .values({
      filename: input.filename,
      storageKey: input.storageKey,
      status: "UPLOADED",
    })
    .returning();

  return document;
}