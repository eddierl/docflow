import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
