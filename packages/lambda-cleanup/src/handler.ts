import { db, idempotencyKeys } from "@docflow/database";
import { lt } from "drizzle-orm";

export const handler = async (event: {
  body?: string;
  headers?: Record<string, string>;
}): Promise<{ statusCode: number; body: string }> => {
  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    console.log("Deleting idempotency keys");
    const keys = await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, new Date()))
      .returning({ key: idempotencyKeys.key });

    console.log({ keys }, "Deleted idempotency keys");

    return {
      statusCode: 200,
      body: JSON.stringify({ length: keys.length }),
    };
  } catch (error) {
    console.error("Error deleting idempotency keys:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
