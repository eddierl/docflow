import { logger } from "@docflow/logger";
import "./bootstrap.js";

import { closeDatabase } from "@docflow/database";
import { publishPendingEvents } from "./publisher.js";

logger.info("Outbox worker started");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let running = true;

export function stopPublisher() {
  running = false;
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export async function startPublisher() {
  while (running) {
    await publishPendingEvents();
    await sleep(5000);
  }
}

const publisher = startPublisher();

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown started");

  stopPublisher();

  await publisher;

  await closeDatabase();

  logger.info("Shutdown completed");

  process.exit(0);
}
