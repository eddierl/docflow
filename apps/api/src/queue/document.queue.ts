import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";
import { awsEnv } from "@docflow/config";

export async function enqueueDocumentProcessing(message: {
  documentId: string;
  storageKey: string;
}) {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: awsEnv.SQS_QUEUE_URL,

      MessageBody: JSON.stringify(message),
    }),
  );
}
