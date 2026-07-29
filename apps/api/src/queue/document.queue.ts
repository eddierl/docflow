import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";

const QUEUE_URL = process.env.SQS_QUEUE_URL!;

export async function enqueueDocumentProcessing(message: {
  documentId: string;
  storageKey: string;
}) {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,

      MessageBody: JSON.stringify(message),
    }),
  );
}
