import type { Message } from "@aws-sdk/client-sqs";
import { parseEvent } from "@docflow/events";
import { logger } from "@docflow/logger";

export const parseMessage = (message: Message) => {
  logger.info(message, "Received:");

  if (!message.Body) {
    logger.error({ message }, "Something bad has happened");
    throw new Error("Something bad has happened");
  }
  const raw = JSON.parse(message.Body);
  const event = parseEvent(raw);
  return event;
};
