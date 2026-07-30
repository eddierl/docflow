import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: true,

  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
  },

  reporter: "list",
});
