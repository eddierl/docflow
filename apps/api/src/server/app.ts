import { randomUUID } from "node:crypto";
import { logger } from "@docflow/logger";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { env } from "../config/env.js";
import { documentsRoutes } from "../documents/documents.routes.js";

export function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
  });

  /* ------------------------------------------------------------------ */
  /*  Security: Helmet — automatic security headers                     */
  /* ------------------------------------------------------------------ */
  app.register(helmet);

  /* ------------------------------------------------------------------ */
  /*  CORS — configurable origin allowlist                              */
  /* ------------------------------------------------------------------ */
  app.register(cors, {
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 86400, // 24 hours
  });

  /* ------------------------------------------------------------------ */
  /*  Rate limiting — protect against abuse                             */
  /* ------------------------------------------------------------------ */
  app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    keyGenerator: (request) => {
      // Use X-Forwarded-For for proxied requests, fallback to IP
      const forwarded = request.headers["x-forwarded-for"];
      return (
        (Array.isArray(forwarded) ? forwarded[0] : forwarded) || request.ip
      );
    },
  });

  /* ------------------------------------------------------------------ */
  /*  OpenAPI / Swagger documentation                                   */
  /* ------------------------------------------------------------------ */
  app.register(swagger, {
    openapi: {
      info: {
        title: "DocFlow API",
        description:
          "Event-driven document processing platform — upload, track, and retrieve processed documents.",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Local development",
        },
      ],
      tags: [
        { name: "Health", description: "Health & readiness checks" },
        { name: "Documents", description: "Document upload & retrieval" },
      ],
    },
  });
  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Request ID tracing — every log line and response gets a trace ID  */
  /* ------------------------------------------------------------------ */
  app.addHook("onRequest", async (request) => {
    const requestId =
      (request.headers["x-request-id"] as string) || randomUUID();
    request.id = requestId;
    // @ts-expect-error — we store a custom property for response timing
    request.__startTime = Date.now();
  });

  app.addHook("onResponse", async (request) => {
    const requestId = request.id;
    // @ts-expect-error — reading our custom property
    const startTime: number | undefined = request.__startTime;
    const responseTimeMs = startTime ? Date.now() - startTime : undefined;

    logger.info(
      {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: request.raw.statusCode,
        responseTimeMs,
      },
      "Request completed",
    );
  });

  /* ------------------------------------------------------------------ */
  /*  Health check — liveness probe                                     */
  /* ------------------------------------------------------------------ */
  app.get(
    "/health",
    {
      schema: {
        summary: "Liveness probe",
        description: "Simple ping to verify the API process is alive.",
        tags: ["Health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              service: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async () => ({
      status: "ok",
      service: "api",
      timestamp: new Date().toISOString(),
    }),
  );

  /* ------------------------------------------------------------------ */
  /*  Readiness probe — checks downstream dependencies                  */
  /* ------------------------------------------------------------------ */
  app.get(
    "/ready",
    {
      schema: {
        summary: "Readiness probe",
        description:
          "Checks that the database connection is healthy before accepting traffic.",
        tags: ["Health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              checks: {
                type: "object",
                additionalProperties: { type: "string" },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              checks: {
                type: "object",
                additionalProperties: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const checks: Record<string, string> = {};

      // Check database connectivity
      try {
        const { getDocument } = await import("@docflow/database");
        // Lightweight DB check — just verify the connection is alive
        // We use a simple SELECT 1 via the existing query layer
        await getDocument("00000000-0000-0000-0000-000000000000");
        checks.database = "healthy";
      } catch {
        checks.database = "unhealthy";
        return reply.status(503).send({ status: "not_ready", checks });
      }

      return { status: "ready", checks };
    },
  );

  /* ------------------------------------------------------------------ */
  /*  Multipart file upload support                                     */
  /* ------------------------------------------------------------------ */
  app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  });

  /* ------------------------------------------------------------------ */
  /*  Business routes                                                     */
  /* ------------------------------------------------------------------ */
  app.register(documentsRoutes);

  return app;
}
