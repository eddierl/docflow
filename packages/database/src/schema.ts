import type { EventType } from "@docflow/events";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  filename: text("filename").notNull(),

  storageKey: text("storage_key").notNull(),

  status: text("status")
    .$type<"UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED">()
    .notNull(),

  extractedText: text("extracted_text"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  processedAt: timestamp("processed_at"),
  retryCount: integer("retry_count").notNull().default(0),

  lastError: text("last_error"),
});

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  type: text("type").$type<EventType>().notNull(),

  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),

  status: text("status")
    .$type<"PENDING" | "PUBLISHING" | "SENT">()
    .notNull()
    .default("PENDING"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),

  // SHA-256 of the request so a key can only be replayed with the same body.
  // requestHash: text("request_hash").notNull(),

  // Null while the original request is still in flight.
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  completedAt: timestamp("completed_at"),

  // After this the key can be reclaimed for a fresh use of the same key.
  expiresAt: timestamp("expires_at").notNull(),
});
