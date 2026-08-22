import { SNSClient } from "@aws-sdk/client-sns";
import { awsEnv } from "@docflow/config";
export const sns = new SNSClient({
  region: process.env.AWS_REGION ?? "ap-southeast-2",
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: awsEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsEnv.AWS_SECRET_ACCESS_KEY,
  },
});
