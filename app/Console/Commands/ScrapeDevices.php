<?php

namespace App\Console\Commands;

use App\CacheKey;
use App\Services\DeviceScraper;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ScrapeDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:scrape';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape the Neural DSP device list page and save to JSON';

    /**
     * Execute the console command.
     */
    public function handle(DeviceScraper $scraper): int
    {
        $this->info('Fetching device list page...');

        try {
            $this->info('Parsing HTML content...');
            $devices = $scraper->scrape();

            if ($devices->isEmpty()) {
                $this->warn('No devices found in the HTML. The page structure may have changed.');

                return Command::FAILURE;
            }

            $this->info("Scraped {$devices->count()} devices");

            $this->saveDevices($devices);
            Cache::forget(CacheKey::DevicesList->value);

            $this->displaySummary($devices);

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Error scraping device list: {$e->getMessage()}");

            return Command::FAILURE;
        }
    }

    /**
     * Save devices to JSON file.
     *
     * @param  \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>  $devices
     */
    protected function saveDevices(\Illuminate\Support\Collection $devices): void
    {
        $json = json_encode($devices->values()->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $path = storage_path('app/devices.json');
        file_put_contents($path, $json);

        $this->info('Successfully wrote devices to storage/app/devices.json');
    }

    /**
     * Display summary by category.
     *
     * @param  \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>  $devices
     */
    protected function displaySummary(\Illuminate\Support\Collection $devices): void
    {
        $categoryCounts = $devices->groupBy('category')
            ->map(fn ($group) => $group->count())
            ->sortDesc();

        $this->newLine();
        $this->info('Summary by category:');

        foreach ($categoryCounts as $category => $count) {
            $this->line("  {$category}: {$count} devices");
        }
    }
}
