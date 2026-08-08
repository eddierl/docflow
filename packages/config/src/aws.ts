import { z } from "zod";

const awsEnvSchema = z.object({
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ENDPOINT: z.url().optional(),
  AWS_ACCESS_KEY_ID: z.string().default("test"),
  AWS_SECRET_ACCESS_KEY: z.string().default("test"),

  SQS_QUEUE_URL: z.url(),
  S3_BUCKET: z.string(),
  DYNAMODB_TABLE_NAME: z.string(),
});

export const awsEnv = awsEnvSchema.parse(process.env);

export type AwsEnv = z.infer<typeof awsEnvSchema>;
