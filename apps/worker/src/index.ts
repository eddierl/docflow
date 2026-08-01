import "./bootstrap.js";
import { awsEnv } from "@docflow/config";
import { closeDatabase } from "@docflow/database";
import { logger } from "@docflow/logger";
import { startHealthServer, stopHealthServer } from "./health.js";
import { startConsumer, stopConsumer } from "./queue/consumer.js";
import { destroyOcrWorker } from "./queue/ocr.js";

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logger.info({ url: awsEnv.SQS_QUEUE_URL }, "SQS");

async function main() {
  await startHealthServer();
  await startConsumer();
}

main().catch((error) => {
  logger.error({ err: error }, "Worker crashed");
  process.exit(1);
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown started");

  stopConsumer();

  await destroyOcrWorker();

  await stopHealthServer();
  await closeDatabase();

  logger.info("Shutdown completed");

  process.exit(0);
}
