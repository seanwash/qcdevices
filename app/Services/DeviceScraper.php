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

    /** Categories with only Name and Added in CorOS columns (no Based on) */
    private const TWO_COLUMN_CATEGORIES = [
        'IR loader',
        'Looper',
        'Utility',
    ];

    /**
     * Scrape devices from the Neural DSP device list page.
     *
     * @return Collection<int, array{category: string, name: string, basedOn: string, addedInCorOS: string}>
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
     * @return Collection<int, array{category: string, name: string, basedOn: string, addedInCorOS: string}>
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

        // Column structure varies by category:
        // - Neural Captures V2: Device category (0), Name (1), Based on (2), Added in CorOS (3)
        // - 2-column categories (IR loader, Looper, Utility): Name (0), Added in CorOS (1)
        // - All others: Name (0), Based on (1), Added in CorOS (2)
        $isV2 = $category === 'Neural Captures V2';
        $isTwoColumn = in_array($category, self::TWO_COLUMN_CATEGORIES);

        if ($isV2) {
            $nameIndex = 1;
            $basedOnIndex = 2;
            $addedInCorOSIndex = 3;
        } elseif ($isTwoColumn) {
            $nameIndex = 0;
            $basedOnIndex = null;
            $addedInCorOSIndex = 1;
        } else {
            $nameIndex = 0;
            $basedOnIndex = 1;
            $addedInCorOSIndex = 2;
        }

        $rows->each(function (Crawler $row) use ($category, $devices, $nameIndex, $basedOnIndex, $addedInCorOSIndex) {
            $cells = $row->filter('div.sc-ec576641-0');

            // Minimum required columns depends on whether category has basedOn
            $minCols = $basedOnIndex !== null ? $basedOnIndex + 1 : $nameIndex + 1;
            if ($cells->count() < $minCols) {
                return;
            }

            $name = trim($cells->eq($nameIndex)->text());

            if (empty($name)) {
                return;
            }

            // Extract basedOn if the category has that column
            $basedOn = '';
            if ($basedOnIndex !== null && $cells->count() > $basedOnIndex) {
                $basedOn = trim($cells->eq($basedOnIndex)->text());

                // Skip version numbers in basedOn (e.g., "1.0.0", "3.3.0")
                if (preg_match('/^\d+\.\d+(\.\d+)?$/', $basedOn)) {
                    $basedOn = '';
                }
            }

            // Extract addedInCorOS version
            $addedInCorOS = '';
            if ($cells->count() > $addedInCorOSIndex) {
                $version = trim($cells->eq($addedInCorOSIndex)->text());
                if (preg_match('/^\d+\.\d+(\.\d+)?$/', $version)) {
                    $addedInCorOS = $version;
                }
            }

            $devices->push([
                'category' => $category,
                'name' => $name,
                'basedOn' => $basedOn,
                'addedInCorOS' => $addedInCorOS,
            ]);
        });
    }
}
