<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class DeviceScraper
{
    /**
     * Scrape devices from the Neural DSP device list page.
     *
     * @return \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>
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
     * @return \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>
     */
    protected function extractDevices(string $html): Collection
    {
        $devices = collect();

        // Suppress warnings from DOMDocument for malformed HTML
        libxml_use_internal_errors(true);

        $dom = new \DOMDocument;
        @$dom->loadHTML('<?xml encoding="UTF-8">'.$html);

        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);

        // Find all h2 elements (category headings)
        $headings = $xpath->query('//h2');

        if ($headings === false || $headings->length === 0) {
            return $devices;
        }

        foreach ($headings as $heading) {
            $category = trim($heading->textContent ?? '');

            if (empty($category)) {
                continue;
            }

            // Skip unreleased devices category entirely
            if ($category === 'Announced devices that have not yet been released') {
                continue;
            }

            // Find the container div that follows this h2
            $current = $heading->nextSibling;

            while ($current !== null) {
                if ($current->nodeType === XML_ELEMENT_NODE) {
                    // Check if this is another h2 (next category)
                    if ($current->nodeName === 'h2') {
                        break;
                    }

                    // Look for div containers
                    if ($current->nodeName === 'div') {
                        // Find all divs within this container that have multiple direct child divs
                        // These represent data rows (each row has multiple cells)
                        $potentialRows = $xpath->query('.//div[count(./div) >= 2]', $current);

                        if ($potentialRows !== false && $potentialRows->length > 0) {
                            $headerFound = false;
                            $nameColumnIndex = 0;
                            $basedOnColumnIndex = null;
                            $addedInColumnIndex = null;

                            foreach ($potentialRows as $row) {
                                // Get all direct child divs (cells) of this row
                                $cells = $xpath->query('./div', $row);

                                if ($cells === false || $cells->length < 2) {
                                    continue;
                                }

                                // Extract text from cells
                                $cellTexts = [];
                                foreach ($cells as $cell) {
                                    $text = trim($cell->textContent ?? '');
                                    if (! empty($text)) {
                                        $cellTexts[] = $text;
                                    }
                                }

                                // Parse header row to identify column indices
                                if (! $headerFound && count($cellTexts) >= 2) {
                                    $firstCell = strtolower(trim($cellTexts[0]));
                                    $secondCell = strtolower(trim($cellTexts[1] ?? ''));

                                    // Check if this looks like a header row
                                    $isHeaderRow = ($firstCell === 'name' || $firstCell === 'namei') &&
                                                  ($secondCell === 'based on' || $secondCell === 'based oni' || str_contains($secondCell, 'based on'));

                                    // Also check for concatenated header text
                                    $firstCellConcatenated = str_contains($firstCell, 'name') &&
                                                             (str_contains($firstCell, 'based on') ||
                                                              str_contains($firstCell, 'added in'));

                                    if ($isHeaderRow || $firstCellConcatenated) {
                                        $headerFound = true;

                                        // Find column indices by checking all header cells
                                        foreach ($cellTexts as $index => $headerText) {
                                            $headerLower = strtolower(trim($headerText));

                                            // Identify Name column (usually first, but check all)
                                            if (($nameColumnIndex === 0 && $index === 0) ||
                                                $headerLower === 'name' ||
                                                $headerLower === 'namei' ||
                                                str_contains($headerLower, 'name')) {
                                                $nameColumnIndex = $index;
                                            }

                                            // Identify Based On column
                                            if (str_contains($headerLower, 'based on') &&
                                                ! str_contains($headerLower, 'added in')) {
                                                $basedOnColumnIndex = $index;
                                            }

                                            // Identify Added In column
                                            if (str_contains($headerLower, 'added in') ||
                                                str_contains($headerLower, 'cor os')) {
                                                $addedInColumnIndex = $index;
                                            }
                                        }

                                        // Fallback: if "Based On" column wasn't found but we have at least 2 columns,
                                        // assume it's at index 1 (second column)
                                        if ($basedOnColumnIndex === null && count($cellTexts) >= 2) {
                                            $basedOnColumnIndex = 1;
                                        }

                                        continue;
                                    }
                                }

                                // Extract device data using column indices
                                if ($headerFound && count($cellTexts) > $nameColumnIndex && ! empty($cellTexts[$nameColumnIndex])) {
                                    $name = trim($cellTexts[$nameColumnIndex]);
                                    $basedOn = '';

                                    // Only extract "Based On" if the column exists and is not the "Added In" column
                                    if ($basedOnColumnIndex !== null &&
                                        $basedOnColumnIndex !== $addedInColumnIndex &&
                                        count($cellTexts) > $basedOnColumnIndex) {
                                        $basedOnValue = trim($cellTexts[$basedOnColumnIndex] ?? '');

                                        // Check if the value looks like a version number (e.g., "1.0.0", "1.4.0", "3.0.0")
                                        // Version numbers typically match pattern like X.Y.Z or X.Y
                                        $isVersionNumber = preg_match('/^\d+\.\d+(\.\d+)?$/', $basedOnValue);

                                        // Also check if this value matches what's in the "Added in" column (if it exists)
                                        $matchesAddedIn = false;
                                        if ($addedInColumnIndex !== null && count($cellTexts) > $addedInColumnIndex) {
                                            $addedInValue = trim($cellTexts[$addedInColumnIndex] ?? '');
                                            $matchesAddedIn = ($basedOnValue === $addedInValue);
                                        }

                                        // Only use it if it's not a version number and doesn't match the "Added in" value
                                        if (! $isVersionNumber && ! $matchesAddedIn && ! empty($basedOnValue)) {
                                            $basedOn = $basedOnValue;
                                        }
                                    }

                                    // Skip if this looks like a header cell
                                    $nameLower = strtolower($name);
                                    $isHeaderCell = in_array($nameLower, ['name', 'namei']) ||
                                                   ($nameLower === 'based on' || $nameLower === 'based oni') ||
                                                   str_contains($nameLower, 'added in coros');

                                    // Skip invalid device names
                                    $isInvalidName = $name === 'Device categoryi' ||
                                                     $name === 'Namei' ||
                                                     $name === 'Based oni';

                                    if (! empty($name) && ! $isHeaderCell && ! $isInvalidName) {
                                        $devices->push([
                                            'category' => $category,
                                            'name' => $name,
                                            'basedOn' => $basedOn,
                                        ]);
                                    }
                                }
                            }

                            if ($devices->isNotEmpty()) {
                                break; // Found data for this category, move to next heading
                            }
                        }
                    }
                }

                $current = $current->nextSibling;
            }
        }

        return $devices;
    }
}
