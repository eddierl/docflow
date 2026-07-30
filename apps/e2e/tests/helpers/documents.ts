import fs from "node:fs/promises";
import path from "node:path";
import type { FixtureDefinition } from "./../fixtures/index.js";

export async function uploadDocument(request: any, fixture: FixtureDefinition) {
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
