import { expect, test } from "@playwright/test";

test("api is alive", async ({ request }) => {
  const response = await request.get("/health");

  expect(response.ok()).toBeTruthy();
});
