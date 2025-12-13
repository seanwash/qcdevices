import type { Device } from "@shared/types";
import { Hono } from "hono";

const routes = new Hono();

routes.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

routes.get("/devices", async (c) => {
	try {
		const dataPath = `${process.cwd()}/data/devices.json`;
		const rawData = await Bun.file(dataPath).text();
		const devices: Device[] = JSON.parse(rawData);

		// Extract unique categories and sort them
		const categories = [...new Set(devices.map((d) => d.category))].sort();

		return c.json({
			devices,
			categories,
		});
	} catch (error) {
		console.error("Error reading devices:", error);
		return c.json(
			{
				error: "Failed to load devices",
				devices: [],
				categories: [],
			},
			500,
		);
	}
});

export default routes;
