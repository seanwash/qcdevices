import type { MiddlewareHandler } from "hono";
import winston from "winston";

const winstonLogger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	transports: [new winston.transports.Console()],
});

export const structuredLogger: MiddlewareHandler = async (c, next) => {
	const start = Date.now();
	await next();
	const duration = Date.now() - start;

	const level =
		c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info";

	winstonLogger.log(level, `${c.req.method} ${c.req.path} ${c.res.status}`, {
		method: c.req.method,
		path: c.req.path,
		status: c.res.status,
		duration,
		ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
		userAgent: c.req.header("user-agent"),
	});
};
