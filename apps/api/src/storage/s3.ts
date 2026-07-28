import {
  S3Client,
} from "@aws-sdk/client-s3";


export const s3 = new S3Client({
  region: "us-east-1",

  endpoint: "http://localhost:4566",

  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },

  forcePathStyle: true,
});