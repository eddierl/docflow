import { S3Client } from "@aws-sdk/client-s3";
import { awsEnv } from "@docflow/config";

export const s3 = new S3Client({
  region: awsEnv.AWS_REGION,
  endpoint: awsEnv.AWS_ENDPOINT,

  credentials: {
    accessKeyId: awsEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsEnv.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
