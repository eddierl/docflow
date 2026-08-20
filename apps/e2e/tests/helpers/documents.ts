import fs from "node:fs/promises";
import path from "node:path";
import type { APIRequestContext } from "@playwright/test";
import type { FixtureDefinition } from "./../fixtures/index.js";

export async function uploadDocument(
  request: APIRequestContext,
  fixture: FixtureDefinition,
) {
  const buffer = await loadFixture(fixture.file);

  return request.post("/documents", {
    multipart: {
      file: {
        name: fixture.file,
        mimeType: fixture.mimeType,
        buffer,
      },
    },
  });
}

export async function loadFixture(fixturePath: string) {
  return fs.readFile(
    path.join(import.meta.dirname, "..", "fixtures", fixturePath),
  );
}
