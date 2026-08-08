import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "node:crypto";

const endpoint = process.env.AWS_ENDPOINT;
const region = process.env.AWS_REGION || "us-east-1";

const dynamodb = new DynamoDBClient({
  region,
  ...(endpoint ? { endpoint } : {}),
  ...(process.env.AWS_ACCESS_KEY_ID
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      }
    : {}),
});

interface DocumentMetadata {
  title: string;
  type: string;
  userId: string;
}

export const handler = async (event: {
  body?: string;
  headers?: Record<string, string>;
}): Promise<{ statusCode: number; body: string }> => {
  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const { title, type, userId }: DocumentMetadata = parsedBody;

    if (!title || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "title and userId are required" }),
      };
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await dynamodb.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME || "Documents",
        Item: {
          id: { S: id },
          title: { S: title },
          type: { S: type || "unknown" },
          userId: { S: userId },
          status: { S: "uploaded" },
          createdAt: { S: now },
          updatedAt: { S: now },
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ id, title, type, userId, status: "uploaded" }),
    };
  } catch (error) {
    console.error("Error processing document:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};