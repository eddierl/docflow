import { DocumentUploadedEventSchema } from "./document.js";

export const EventSchemas = {
  DOCUMENT_UPLOADED: DocumentUploadedEventSchema,
} as const;

export type EventType = keyof typeof EventSchemas;
