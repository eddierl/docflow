import { logger } from "@docflow/logger";
import "./bootstrap.js";

import { publishPendingEvents } from "./publisher.js";

logger.info("Outbox worker started");

setInterval(async () => {
  await publishPendingEvents();
}, 5000);
