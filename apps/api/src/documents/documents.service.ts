import {  documents } from "@docflow/database";
import { db } from "../database.js";
export async function createDocument(input: {
	filename: string;
	storageKey: string;
}) {
	const [document] = await db
		.insert(documents)
		.values({
			filename: input.filename,
			storageKey: input.storageKey,
			status: "UPLOADED",
		})
		.returning();

	return document;
}
