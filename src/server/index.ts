import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import deviceRoutes from './routes/devices.js';

const app = new Hono();

// Middleware
app.use('*', logger());
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

console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
