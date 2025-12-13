import * as cheerio from 'cheerio';
import type { Device } from '../../shared/types';

export type { Device };

type Schema = Record<string, number>;

const SKIP_CATEGORIES = ['Announced devices that have not yet been released'];

/**
 * Column schema mapping for each category.
 * Maps field names to their column indices (0-based).
 *
 * Schema types:
 * - 2-column: name, addedInCorOS
 * - 4-column V2: deviceCategory, name, basedOn, addedInCorOS
 * - 4-column Plugin: deviceCategory, name, addedInCorOS, pluginSource
 * - 5-column standard: name, basedOn, addedInCorOS, previousName, updatedInCorOS
 */
const CATEGORY_SCHEMAS: Record<string, Schema> = {
  // 4-column V2 schema
  'Neural Captures V2': {
    deviceCategory: 0,
    name: 1,
    basedOn: 2,
    addedInCorOS: 3,
  },

  // 4-column Plugin schema (deviceCategory in col 0, pluginSource in col 3)
  'Plugin devices': {
    deviceCategory: 0,
    name: 1,
    addedInCorOS: 2,
    pluginSource: 3,
  },

  // 2-column schema (name, addedInCorOS only)
  'IR loader': {
    name: 0,
    addedInCorOS: 1,
  },
  Looper: {
    name: 0,
    addedInCorOS: 1,
  },
  Utility: {
    name: 0,
    addedInCorOS: 1,
  },

  // 5-column standard schema (name, basedOn, addedInCorOS, previousName, updatedInCorOS)
  'Neural Captures V1': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Guitar amps': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Guitar cabinets': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Guitar overdrive': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Bass amps': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Bass cabinets': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  'Bass overdrive': {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Delay: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Reverb: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Compressor: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Pitch: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Modulation: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Morph: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Filter: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  EQ: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Wah: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
  Synth: {
    name: 0,
    basedOn: 1,
    addedInCorOS: 2,
    previousName: 3,
    updatedInCorOS: 4,
  },
};

const VERSION_REGEX = /^\d+\.\d+(\.\d+)?$/;

/**
 * Scrape devices from the Neural DSP device list page.
 */
export async function scrapeDevices(
  url = 'https://neuraldsp.com/device-list'
): Promise<Device[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: HTTP ${response.status}`);
  }

  const html = await response.text();

  if (!html) {
    throw new Error('Received empty response from page');
  }

  return extractDevices(html);
}

/**
 * Extract devices from HTML content.
 */
export function extractDevices(html: string): Device[] {
  const devices: Device[] = [];
  const $ = cheerio.load(html);

  $('h2').each((_, heading) => {
    const category = $(heading).text().trim();

    if (!category || SKIP_CATEGORIES.includes(category)) {
      return;
    }

    const container = $(heading).nextAll('div').first();

    if (container.length === 0) {
      return;
    }

    parseTable($, container, category, devices);
  });

  return devices;
}

/**
 * Parse a category table and extract devices.
 */
function parseTable(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: cheerio.Cheerio<any>,
  category: string,
  devices: Device[]
): void {
  // Data rows have class sc-97391185-0
  const rows = container.find('div.sc-97391185-0');

  if (rows.length === 0) {
    return;
  }

  // Get schema for this category - skip if not defined
  const schema = CATEGORY_SCHEMAS[category];
  if (!schema) {
    return;
  }

  rows.each((_, row) => {
    const cells = $(row).find('div.sc-ec576641-0');

    // Ensure we have at least the name column
    const nameIndex = schema.name ?? 0;
    if (cells.length <= nameIndex) {
      return;
    }

    const name = cells.eq(nameIndex).text().trim();

    if (!name) {
      return;
    }

    // Build device data using schema
    const device: Device = {
      category,
      name,
      basedOn: '',
      addedInCorOS: '',
    };

    // Extract basedOn if schema includes it
    if (schema.basedOn !== undefined && cells.length > schema.basedOn) {
      const basedOn = cells.eq(schema.basedOn).text().trim();
      // Skip version numbers in basedOn (e.g., "1.0.0", "3.3.0")
      if (!VERSION_REGEX.test(basedOn)) {
        device.basedOn = basedOn;
      }
    }

    // Extract addedInCorOS if schema includes it
    if (schema.addedInCorOS !== undefined && cells.length > schema.addedInCorOS) {
      const version = cells.eq(schema.addedInCorOS).text().trim();
      if (VERSION_REGEX.test(version)) {
        device.addedInCorOS = version;
      }
    }

    // Extract deviceCategory if schema includes it (V2 and Plugin devices)
    if (schema.deviceCategory !== undefined && cells.length > schema.deviceCategory) {
      const deviceCategory = cells.eq(schema.deviceCategory).text().trim();
      if (deviceCategory && !VERSION_REGEX.test(deviceCategory)) {
        device.deviceCategory = deviceCategory;
      }
    }

    // Extract previousName if schema includes it
    if (schema.previousName !== undefined && cells.length > schema.previousName) {
      const previousName = cells.eq(schema.previousName).text().trim();
      if (previousName) {
        device.previousName = previousName;
      }
    }

    // Extract updatedInCorOS if schema includes it
    if (schema.updatedInCorOS !== undefined && cells.length > schema.updatedInCorOS) {
      const version = cells.eq(schema.updatedInCorOS).text().trim();
      // Only set if it matches version pattern and is not empty
      if (version && VERSION_REGEX.test(version)) {
        device.updatedInCorOS = version;
      }
    }

    // Extract pluginSource if schema includes it (Plugin devices only)
    if (schema.pluginSource !== undefined && cells.length > schema.pluginSource) {
      const pluginSource = cells.eq(schema.pluginSource).text().trim();
      if (pluginSource) {
        device.pluginSource = pluginSource;
      }
    }

    devices.push(device);
  });
}
