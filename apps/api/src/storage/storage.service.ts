import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3 } from "./s3.js";

const BUCKET = "docflow-uploads";

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}
