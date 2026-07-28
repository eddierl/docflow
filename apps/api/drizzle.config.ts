import "dotenv/config";

import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const env = z
	.object({
		DATABASE_URL: z.string().url(),
	})
	.parse(process.env);

export default defineConfig({
	schema: "./src/database/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
