import {
  type Message,
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "@docflow/aws";

export const deleteMessage = (QueueUrl: string, message: Message) => {
  return sqs.send(
    new DeleteMessageCommand({
      QueueUrl,

      ReceiptHandle: message.ReceiptHandle!,
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
