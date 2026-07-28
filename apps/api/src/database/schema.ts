import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey(),

	filename: text("filename").notNull(),

	storageKey: text("storage_key").notNull(),

	status: text("status").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	processedAt: timestamp("processed_at"),
});
