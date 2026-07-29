import "./bootstrap.js";
import { awsEnv } from "@docflow/config";
import { logger } from "@docflow/logger";
import { startConsumer } from "./queue/consumer.js";

logger.info({ url: awsEnv.SQS_QUEUE_URL }, "SQS");

await startConsumer();
