import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { awsEnv } from "@docflow/config";

export const dynamodb = new DynamoDBClient({
  region: awsEnv.AWS_REGION,
  endpoint: awsEnv.AWS_ENDPOINT,
  credentials: {
    accessKeyId: awsEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsEnv.AWS_SECRET_ACCESS_KEY,
  },
});
