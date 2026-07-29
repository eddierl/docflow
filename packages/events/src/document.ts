import z from "zod";

export type DocumentUploadedEvent = z.infer<typeof DocumentUploadedEventSchema>;

export const DocumentUploadedEventSchema = z.object({
  eventType: z.literal("DOCUMENT_UPLOADED"),
  payload: z.object({
    documentId: z.string(),
    storageKey: z.string(),
  }),
});
