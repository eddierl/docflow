import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { documentsRoutes } from "../documents/documents.routes.js";

export function buildApp() {
	const app = Fastify({
		logger: true,
	});

	app.get("/health", async () => {
		return {
			status: "ok",
			service: "api",
		};
	});

	app.register(multipart);
	app.register(documentsRoutes);

	return app;
}
