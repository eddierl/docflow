import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),

  AWS_REGION: z.string(),

  AWS_ENDPOINT: z.url(),

  SQS_QUEUE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
