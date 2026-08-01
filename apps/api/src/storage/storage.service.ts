import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3 } from "@docflow/aws";
import { awsEnv } from "@docflow/config";

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: awsEnv.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}
