import "./bootstrap.js";

console.log("SQS:", process.env.SQS_QUEUE_URL);

import "./config/env.js";

import { startConsumer } from "./queue/consumer.js";

startConsumer();
