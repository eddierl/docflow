import { db, documents } from "@docflow/database";
import { describe, expect, it } from "vitest";
import {
  claimDocument,
  releaseDocumentForRetry,
} from "../src/document-claim.js";

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

  it("allows reclaim a document", async () => {
    const [document] = await db
      .insert(documents)
      .values({
        filename: "test.pdf",
        storageKey: "uploads/test.pdf",
        status: "PROCESSING",
        processedAt: new Date(Date.now() - 20 * 60 * 1000),
      })
      .returning();

    const results = await Promise.all([
      claimDocument(document.id),
      claimDocument(document.id),
    ]);

    const successfulClaims = results.filter(Boolean);

    expect(successfulClaims).toHaveLength(1);
  });

  it("allows reclaim a document after failed", async () => {
    const [document] = await db
      .insert(documents)
      .values({
        filename: "test.pdf",
        storageKey: "uploads/test.pdf",
        status: "FAILED",
      })
      .returning();

    await releaseDocumentForRetry(document.id, "something bad happened");

    const results = await Promise.all([
      claimDocument(document.id),
      claimDocument(document.id),
    ]);

    const successfulClaims = results.filter(Boolean);

    expect(successfulClaims).toHaveLength(1);
    expect(successfulClaims).toMatchObject([
      {
        retryCount: 1,
        lastError: "something bad happened",
      },
    ]);
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
