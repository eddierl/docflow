import { SQSClient } from "@aws-sdk/client-sqs";
import { awsEnv } from "@docflow/config";

export const sqs = new SQSClient({
  region: awsEnv.AWS_REGION,
  endpoint: awsEnv.AWS_ENDPOINT,

  credentials: {
    accessKeyId: awsEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsEnv.AWS_SECRET_ACCESS_KEY,
  },
});
