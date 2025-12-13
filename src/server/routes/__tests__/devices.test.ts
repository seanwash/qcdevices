import { describe, it, expect } from 'bun:test';
import { Hono } from 'hono';

// Since Bun's module mocking for fs is complex, we'll test the health endpoint
// and create a separate testable version for device logic

describe('device routes', () => {
  describe('GET /api/health', () => {
    it('should return status ok with timestamp', async () => {
      // Import fresh for each test
      const deviceRoutes = (await import('../devices')).default;
      const app = new Hono();
      app.route('/api', deviceRoutes);

      const response = await app.request('/api/health');
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.status).toBe('ok');
      expect(json.timestamp).toBeDefined();
    });

    it('should return valid ISO timestamp', async () => {
      const deviceRoutes = (await import('../devices')).default;
      const app = new Hono();
      app.route('/api', deviceRoutes);

      const before = new Date().toISOString();
      const response = await app.request('/api/health');
      const after = new Date().toISOString();
      const json = (await response.json()) as { timestamp: string };

      expect(json.timestamp >= before).toBe(true);
      expect(json.timestamp <= after).toBe(true);
    });
  });

  describe('GET /api/devices', () => {
    it('should return devices from the data file', async () => {
      const deviceRoutes = (await import('../devices')).default;
      const app = new Hono();
      app.route('/api', deviceRoutes);

      const response = await app.request('/api/devices');
      const json = (await response.json()) as { devices: unknown[]; categories: string[] };

      expect(response.status).toBe(200);
      expect(Array.isArray(json.devices)).toBe(true);
      expect(Array.isArray(json.categories)).toBe(true);
    });

    it('should return sorted unique categories', async () => {
      const deviceRoutes = (await import('../devices')).default;
      const app = new Hono();
      app.route('/api', deviceRoutes);

      const response = await app.request('/api/devices');
      const json = (await response.json()) as { categories: string[] };

      // Categories should be sorted alphabetically
      const sortedCategories = [...json.categories].sort();
      expect(json.categories).toEqual(sortedCategories);

      // Categories should be unique
      const uniqueCategories = [...new Set(json.categories)];
      expect(json.categories).toEqual(uniqueCategories);
    });
  });
});
