import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Device {
  category: string;
  name: string;
  basedOn: string;
  addedInCorOS: string;
  deviceCategory?: string;
  previousName?: string;
  updatedInCorOS?: string;
  pluginSource?: string;
}

const deviceRoutes = new Hono();

// Health check endpoint for Railway
deviceRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Get all devices and categories
deviceRoutes.get('/devices', (c) => {
  try {
    const dataPath = join(process.cwd(), 'data/devices.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const devices: Device[] = JSON.parse(rawData);

    // Extract unique categories and sort them
    const categories = [...new Set(devices.map((d) => d.category))].sort();

    return c.json({
      devices,
      categories,
    });
  } catch (error) {
    console.error('Error reading devices:', error);
    return c.json(
      {
        error: 'Failed to load devices',
        devices: [],
        categories: [],
      },
      500
    );
  }
});

export default deviceRoutes;
