import { dbSchema } from "@docflow/config";
import { z } from "zod";

/** Allowed MIME types for document uploads */
export const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "text/plain",
] as const;

export const apiEnvSchema = dbSchema.extend({
  PORT: z.coerce.number().default(3000),

  /** Maximum file upload size in bytes (default: 10 MB) */
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024),

  /**
   * CORS origins — comma-separated list of allowed origins.
   * Use '*' to allow all origins (not recommended for production).
   */
  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((val) =>
      val === "*" ? true : val.split(",").map((s) => s.trim()),
    ),

  /**
   * Rate limiting — max requests per window.
   * Default: 100 requests per 15 seconds.
   */
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default("15 seconds"),

  /**
   * Log level for Pino logger.
   */
  LOG_LEVEL: z.string().default("info"),
});

export const env = apiEnvSchema.parse(process.env);
