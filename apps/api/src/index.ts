import { logger } from "@docflow/logger";
import "./bootstrap.js";
import { closeDatabase } from "@docflow/database";
import { env } from "./config/env.js";
import { buildApp } from "./server/app.js";

const app = buildApp();

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown started");

  await app.close();
  await closeDatabase();

  logger.info("Shutdown completed");

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

await app.listen({
  port: env.PORT,
  host: "0.0.0.0",
});
