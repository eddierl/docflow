import {
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";

export const deleteMessage = (QueueUrl: string, message: Message) => {
  if (!message.ReceiptHandle) return;
  return sqs.send(
    new DeleteMessageCommand({
      QueueUrl,
      ReceiptHandle: message.ReceiptHandle,
    }),
  );
};
export const receiveMessages = async (QueueUrl: string) => {
  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl,

      MaxNumberOfMessages: 1,

      WaitTimeSeconds: 10,
    }),
  );
  return response.Messages ?? [];
};
