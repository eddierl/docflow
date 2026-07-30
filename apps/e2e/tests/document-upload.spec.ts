import path from "node:path";
import { expect, test } from "@playwright/test";
import { Fixtures } from "./fixtures/index.js";
import { uploadDocument } from "./helpers/documents.js";

test("api is alive", async ({ request }) => {
  const response = await request.get("/health");

  expect(response.ok()).toBeTruthy();
});

test("uploads a document", async ({ request }) => {
  const response = await uploadDocument(request, Fixtures.textHello);

  expect(response.status()).toBe(201);

  const document = await response.json();

  expect(document.id).toBeDefined();
  expect(document.filename).toBe(path.basename(Fixtures.textHello.file));
  expect(document.status).toBe("UPLOADED");

  await expect
    .poll(
      async () => {
        const result = await request.get(`/documents/${document.id}`);

        const body = await result.json();

        return body.status;
      },
      { timeout: 10000 },
    )
    .toBe("PROCESSED");
});
