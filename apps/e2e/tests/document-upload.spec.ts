import path from "node:path";
import { type APIRequestContext, expect, test } from "@playwright/test";
import { type FixtureDefinition, Fixtures } from "./fixtures/index.js";
import { uploadDocument } from "./helpers/documents.js";

export async function uploadAndWaitForProcessing(
  request: APIRequestContext,
  fixture: FixtureDefinition,
  options?: {
    timeout?: number;
  },
) {
  const response = await uploadDocument(request, fixture);

  expect(response.status()).toBe(201);

  const document = await response.json();

  expect(document.id).toBeDefined();
  expect(document.filename).toBe(path.basename(fixture.file));
  expect(document.status).toBe("UPLOADED");

  await expect
    .poll(
      async () => {
        const result = await request.get(`/documents/${document.id}`);

        const json = await result.json();

        return json;
      },
      {
        timeout: options?.timeout ?? 30000,
        intervals: [1_000, 2_000, 10_000],
      },
    )
    .toMatchObject({
      status: "PROCESSED",
    });

  return document.id;
}

test("uploads a document", async ({ request }) => {
  const id = await uploadAndWaitForProcessing(request, Fixtures.textHello);

  expect(id).toBeDefined();
});

test("uploads a pdf document extract text", async ({ request }) => {
  const id = await uploadAndWaitForProcessing(request, Fixtures.textPdf);

  const response = await request.get(`/documents/${id}`);
  const document = await response.json();

  expect(document.extractedText).toContain("Just another test on the wall");
});

test("uploads an image and extract text", async ({ request }) => {
  const id = await uploadAndWaitForProcessing(request, Fixtures.scannedImage);

  const response = await request.get(`/documents/${id}`);
  const document = await response.json();

  expect(document.extractedText).toContain("Hello DocFlow OCR");
});
