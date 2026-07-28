import {
  createDatabase,
} from "@docflow/database";

import {
  env,
} from "./config/env.js";


export const db = createDatabase(
  env.DATABASE_URL,
);