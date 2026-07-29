import { EventSchemas } from "./registry.js";

export function parseEvent(input: unknown) {
  const event = input as {
    eventType: string;
  };

  const schema = EventSchemas[event.eventType as keyof typeof EventSchemas];

  if (!schema) {
    throw new Error(`Unknown event type: ${event.eventType}`);
  }

  return schema.parse(input);
}
