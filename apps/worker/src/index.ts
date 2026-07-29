import "./bootstrap.js";
import { awsEnv } from "@docflow/config";

import { startConsumer } from "./queue/consumer.js";

console.log("SQS:", awsEnv.SQS_QUEUE_URL);

await startConsumer();
