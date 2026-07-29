import "./bootstrap.js";

import { startConsumer } from "./queue/consumer.js";

console.log("SQS:", process.env.SQS_QUEUE_URL);

await startConsumer();
