import http from "node:http";
import { db } from "@docflow/database";
import { logger } from "@docflow/logger";
import { sql } from "drizzle-orm";

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/ready") {
    try {
      await db.execute(sql`SELECT 1`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } catch (error) {
      logger.error({ err: error }, "Readiness check failed");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "error", message: "Database unreachable" }),
      );
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

export function startHealthServer() {
  return new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      logger.info({ port: PORT }, "Outbox worker health server started");
      resolve();
    });
  });
}

export function stopHealthServer() {
  return new Promise<void>((resolve) => {
    server.close(() => {
      logger.info("Health server stopped");
      resolve();
    });
  });
}
