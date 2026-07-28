import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";


export function createDatabase(url: string) {
  const client = postgres(url);

  return drizzle(client);
}