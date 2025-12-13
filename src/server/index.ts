import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { MiddlewareHandler } from 'hono';
import winston from 'winston';
import deviceRoutes from './routes/devices.js';

const app = new Hono();

// Winston logger for Railway structured logs
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Request logging middleware
const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  const level = c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info';

  winstonLogger.log(level, `${c.req.method} ${c.req.path} ${c.res.status}`, {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    userAgent: c.req.header('user-agent'),
  });
};

// Middleware - use pretty logs in dev, structured JSON in production
const isDev = process.env.NODE_ENV !== 'production';
app.use('*', isDev ? logger() : requestLogger);
app.use('/api/*', cors());

// API routes
app.route('/api', deviceRoutes);

// Serve static files from the React build
app.use('/*', serveStatic({ root: './dist/client' }));

// SPA fallback - serve index.html for all non-API routes
app.get('*', async (c) => {
  const file = Bun.file('./dist/client/index.html');
  if (await file.exists()) {
    return c.html(await file.text());
  }
  return c.text('Not found', 404);
});

const port = parseInt(process.env.PORT || '3000', 10);

// Graceful shutdown handling for Railway deployments
// https://docs.railway.com/guides/nodejs-sigterm
process.on('SIGTERM', () => {
  winstonLogger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
