import "./bootstrap.js";

import {
  publishEvents,
} from "./publisher.js";


console.log("Outbox worker started");


setInterval(
  async () => {
    await publishEvents();
  },
  5000
);