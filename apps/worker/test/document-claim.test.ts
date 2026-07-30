import { db, documents } from "@docflow/database";
import { describe, expect, it } from "vitest";
import { claimDocument } from "../src/document-claim.js";

describe("document claim", () => {
  it("allows only one worker to claim a document", async () => {
    const [document] = await db
      .insert(documents)
      .values({
        filename: "test.pdf",
        storageKey: "uploads/test.pdf",
        status: "UPLOADED",
      })
      .returning();

    const results = await Promise.all([
      claimDocument(document.id),
      claimDocument(document.id),
    ]);

    const successfulClaims = results.filter(Boolean);

    expect(successfulClaims).toHaveLength(1);
  });

  it("does not claim a processed document", async () => {
    const [document] = await db
      .insert(documents)
      .values({
        filename: "test.pdf",
        storageKey: "uploads/test.pdf",
        status: "PROCESSED",
      })
      .returning();

    const result = await claimDocument(document.id);

    expect(result).toBeNull();
  });
});
