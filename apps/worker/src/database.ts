import {
  createDatabase,
} from "@docflow/database";


const databaseUrl =
  process.env.DATABASE_URL;


if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing",
  );
}


export const db =
  createDatabase(databaseUrl);