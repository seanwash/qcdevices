<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class DeviceScraper
{
    private const SKIP_CATEGORIES = [
        'Announced devices that have not yet been released',
    ];

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
    private const CATEGORY_SCHEMAS = [
        // 4-column V2 schema
        'Neural Captures V2' => [
            'deviceCategory' => 0,
            'name' => 1,
            'basedOn' => 2,
            'addedInCorOS' => 3,
        ],

        // 4-column Plugin schema (deviceCategory in col 0, pluginSource in col 3)
        'Plugin devices' => [
            'deviceCategory' => 0,
            'name' => 1,
            'addedInCorOS' => 2,
            'pluginSource' => 3,
        ],

        // 2-column schema (name, addedInCorOS only)
        'IR loader' => [
            'name' => 0,
            'addedInCorOS' => 1,
        ],
        'Looper' => [
            'name' => 0,
            'addedInCorOS' => 1,
        ],
        'Utility' => [
            'name' => 0,
            'addedInCorOS' => 1,
        ],

        // 5-column standard schema (name, basedOn, addedInCorOS, previousName, updatedInCorOS)
        'Neural Captures V1' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Guitar amps' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Guitar cabinets' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Guitar overdrive' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Bass amps' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Bass cabinets' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Bass overdrive' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Delay' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Reverb' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Compressor' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Pitch' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Modulation' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Morph' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Filter' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'EQ' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Wah' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
        'Synth' => [
            'name' => 0,
            'basedOn' => 1,
            'addedInCorOS' => 2,
            'previousName' => 3,
            'updatedInCorOS' => 4,
        ],
    ];

    /**
     * Scrape devices from the Neural DSP device list page.
     *
     * @return Collection<int, array{
     *     category: string,
     *     name: string,
     *     basedOn: string,
     *     addedInCorOS: string,
     *     deviceCategory?: string,
     *     previousName?: string,
     *     updatedInCorOS?: string,
     *     pluginSource?: string
     * }>
     */
    public function scrape(string $url = 'https://neuraldsp.com/device-list'): Collection
    {
        $response = Http::timeout(30)->get($url);

        if (! $response->successful()) {
            throw new \RuntimeException("Failed to fetch page: HTTP {$response->status()}");
        }

        $html = $response->body();

        if (empty($html)) {
            throw new \RuntimeException('Received empty response from page');
        }

        return $this->extractDevices($html);
    }

    /**
     * Extract devices from HTML content.
     *
     * @return Collection<int, array{
     *     category: string,
     *     name: string,
     *     basedOn: string,
     *     addedInCorOS: string,
     *     deviceCategory?: string,
     *     previousName?: string,
     *     updatedInCorOS?: string,
     *     pluginSource?: string
     * }>
     */
    protected function extractDevices(string $html): Collection
    {
        $devices = collect();
        $crawler = new Crawler($html);

        $crawler->filter('h2')->each(function (Crawler $heading) use ($devices) {
            $category = trim($heading->text());

            if (empty($category) || in_array($category, self::SKIP_CATEGORIES)) {
                return;
            }

            $container = $heading->nextAll()->filter('div')->first();

            if ($container->count() === 0) {
                return;
            }

            $this->parseTable($container, $category, $devices);
        });

        return $devices;
    }

    /**
     * Parse a category table and extract devices.
     */
    protected function parseTable(Crawler $container, string $category, Collection $devices): void
    {
        // Data rows have class sc-97391185-0
        $rows = $container->filter('div.sc-97391185-0');

        if ($rows->count() === 0) {
            return;
        }

        // Get schema for this category - skip if not defined
        if (! isset(self::CATEGORY_SCHEMAS[$category])) {
            return;
        }

        $schema = self::CATEGORY_SCHEMAS[$category];

        $rows->each(function (Crawler $row) use ($category, $devices, $schema) {
            $cells = $row->filter('div.sc-ec576641-0');

            // Ensure we have at least the name column
            $nameIndex = $schema['name'] ?? 0;
            if ($cells->count() <= $nameIndex) {
                return;
            }

            $name = trim($cells->eq($nameIndex)->text());

            if (empty($name)) {
                return;
            }

            // Build device data using schema
            $device = [
                'category' => $category,
                'name' => $name,
                'basedOn' => '',
                'addedInCorOS' => '',
            ];

            // Extract basedOn if schema includes it
            if (isset($schema['basedOn']) && $cells->count() > $schema['basedOn']) {
                $basedOn = trim($cells->eq($schema['basedOn'])->text());
                // Skip version numbers in basedOn (e.g., "1.0.0", "3.3.0")
                if (! preg_match('/^\d+\.\d+(\.\d+)?$/', $basedOn)) {
                    $device['basedOn'] = $basedOn;
                }
            }

            // Extract addedInCorOS if schema includes it
            if (isset($schema['addedInCorOS']) && $cells->count() > $schema['addedInCorOS']) {
                $version = trim($cells->eq($schema['addedInCorOS'])->text());
                if (preg_match('/^\d+\.\d+(\.\d+)?$/', $version)) {
                    $device['addedInCorOS'] = $version;
                }
            }

            // Extract deviceCategory if schema includes it (V2 and Plugin devices)
            if (isset($schema['deviceCategory']) && $cells->count() > $schema['deviceCategory']) {
                $deviceCategory = trim($cells->eq($schema['deviceCategory'])->text());
                if (! empty($deviceCategory) && ! preg_match('/^\d+\.\d+(\.\d+)?$/', $deviceCategory)) {
                    $device['deviceCategory'] = $deviceCategory;
                }
            }

            // Extract previousName if schema includes it
            if (isset($schema['previousName']) && $cells->count() > $schema['previousName']) {
                $previousName = trim($cells->eq($schema['previousName'])->text());
                if (! empty($previousName)) {
                    $device['previousName'] = $previousName;
                }
            }

            // Extract updatedInCorOS if schema includes it
            if (isset($schema['updatedInCorOS']) && $cells->count() > $schema['updatedInCorOS']) {
                $version = trim($cells->eq($schema['updatedInCorOS'])->text());
                // Only set if it matches version pattern and is not empty
                if (! empty($version) && preg_match('/^\d+\.\d+(\.\d+)?$/', $version)) {
                    $device['updatedInCorOS'] = $version;
                }
            }

            // Extract pluginSource if schema includes it (Plugin devices only)
            if (isset($schema['pluginSource']) && $cells->count() > $schema['pluginSource']) {
                $pluginSource = trim($cells->eq($schema['pluginSource'])->text());
                if (! empty($pluginSource)) {
                    $device['pluginSource'] = $pluginSource;
                }
            }

            $devices->push($device);
        });
    }
}
