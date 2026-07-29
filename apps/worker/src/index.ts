import "./bootstrap.js";
import { awsEnv } from "@docflow/config";
import { closeDatabase } from "@docflow/database";
import { logger } from "@docflow/logger";
import { startConsumer, stopConsumer } from "./queue/consumer.js";

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logger.info({ url: awsEnv.SQS_QUEUE_URL }, "SQS");

await startConsumer();

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown started");

  stopConsumer();

  await closeDatabase();

  logger.info("Shutdown completed");

  process.exit(0);
}
