import { z } from "zod";

export const dbSchema = z.object({
  DATABASE_URL: z.url(),
});

export type DbEnv = z.infer<typeof dbSchema>;
