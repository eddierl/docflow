import "./bootstrap.js";

import { publishPendingEvents } from "./publisher.js";

console.log("Outbox worker started");

setInterval(async () => {
  await publishPendingEvents();
}, 5000);
