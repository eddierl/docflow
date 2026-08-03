import { createServer, type Server } from "node:http";

let server: Server | null = null;

export async function startHealthServer(): Promise<void> {
  return new Promise((resolve) => {
    server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    });
    const port = Number(process.env.HEALTH_PORT ?? 3001);
    server.listen(port, () => resolve());
  });
}

export async function stopHealthServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = null;
  }
}
