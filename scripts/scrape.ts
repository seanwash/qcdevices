import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scrapeDevices } from '../src/server/services/scraper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Scraping devices from Neural DSP...');

  try {
    const devices = await scrapeDevices();

    const outputPath = join(__dirname, '../data/devices.json');
    writeFileSync(outputPath, JSON.stringify(devices, null, 2));

    // Count devices by category
    const categoryCounts = devices.reduce(
      (acc, device) => {
        acc[device.category] = (acc[device.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\nDevices scraped successfully!');
    console.log(`Total devices: ${devices.length}`);
    console.log('\nBy category:');

    Object.entries(categoryCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

    console.log(`\nSaved to: ${outputPath}`);
  } catch (error) {
    console.error('Failed to scrape devices:', error);
    process.exit(1);
  }
}

main();
