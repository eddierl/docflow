import { dbSchema } from "@docflow/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const env = dbSchema.parse(process.env);

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, {
  schema,
});

export function createDatabase(url: string) {
  const client = postgres(url);

  return drizzle(client);
}
