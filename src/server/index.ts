import apiRoutes from "@server/routes/api";
import { structuredLogger } from "@server/services/structuredLogger";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", structuredLogger);
app.use("/api/*", cors());

// API routes
app.route("/api", apiRoutes);

// Serve static files from the React build
app.use("/*", serveStatic({ root: "./dist/client" }));

// SPA fallback - serve index.html for all non-API routes
app.get("*", async (c) => {
	const file = Bun.file("./dist/client/index.html");
	if (await file.exists()) {
		return c.html(await file.text());
	}
	return c.text("Not found", 404);
});

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Server is running on http://localhost:${port}`);

export default {
	port,
	fetch: app.fetch,
};
