import { env } from "./config/env.js";
import { buildApp } from "./server/app.js";

const app = buildApp();

await app.listen({
  port: env.PORT,
  host: "0.0.0.0",
});
