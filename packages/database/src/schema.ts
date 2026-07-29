import type { EventType } from "@docflow/events";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  filename: text("filename").notNull(),

  storageKey: text("storage_key").notNull(),

  status: text("status").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  processedAt: timestamp("processed_at"),
});

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  type: text("type").$type<EventType>().notNull(),

  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),

  status: text("status")
    .$type<"PENDING" | "SENT">()
    .notNull()
    .default("PENDING"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});
