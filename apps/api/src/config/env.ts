import { dbSchema } from "@docflow/config";
import { z } from "zod";

export const apiEnvSchema = dbSchema.extend({
  PORT: z.coerce.number().default(3000),
});

export const env = apiEnvSchema.parse(process.env);
