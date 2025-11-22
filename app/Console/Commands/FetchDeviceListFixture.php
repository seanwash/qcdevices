<?php

namespace App\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class FetchDeviceListFixture extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:fetch-fixture';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch the Neural DSP device list page HTML and save it as a test fixture';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Fetching device list page...');

        try {
            $response = Http::timeout(30)->get('https://neuraldsp.com/device-list');

            if (! $response->successful()) {
                $this->error("Failed to fetch page: HTTP {$response->status()}");

                return Command::FAILURE;
            }

            $html = $response->body();

            if (empty($html)) {
                $this->error('Received empty response from page');

                return Command::FAILURE;
            }

            $fixturePath = base_path('tests/Fixtures/device-list.html');

            if (! is_dir(dirname($fixturePath))) {
                mkdir(dirname($fixturePath), 0755, true);
            }

            file_put_contents($fixturePath, $html);

            $this->info("Successfully saved HTML fixture to {$fixturePath}");
            $this->info('Size: '.number_format(strlen($html)).' bytes');

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error("Error fetching fixture: {$e->getMessage()}");

            return Command::FAILURE;
        }
    }
}
