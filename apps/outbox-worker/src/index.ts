import { logger } from "@docflow/logger";
import "./bootstrap.js";

import { closeDatabase } from "@docflow/database";
import { startHealthServer, stopHealthServer } from "./health.js";
import { publishPendingEvents } from "./publisher.js";

logger.info("Outbox worker started");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let running = true;

export function stopPublisher() {
  running = false;
}

let publisherPromise: Promise<void> | null = null;

export async function startPublisher() {
  while (running) {
    await publishPendingEvents();
    await sleep(5000);
  }
}

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown started");

  stopPublisher();

  if (publisherPromise) {
    await publisherPromise;
  }

  await stopHealthServer();
  await closeDatabase();

  logger.info("Shutdown completed");

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function main() {
  await startHealthServer();
  publisherPromise = startPublisher();
  await publisherPromise;
}

main().catch((error) => {
  logger.error({ err: error }, "Outbox worker crashed");
  process.exit(1);
});
