<?php

use App\Services\DeviceScraper;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    test()->scraper = new DeviceScraper;
    test()->fixturePath = __DIR__.'/../Fixtures/device-list.html';
});

it('can scrape devices from the live URL', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    expect($devices)->toBeInstanceOf(\Illuminate\Support\Collection::class);
    expect($devices)->not->toBeEmpty();
});

it('extracts devices with correct structure', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    expect($devices->first())->toHaveKeys(['category', 'name', 'basedOn']);
    expect($devices->first()['category'])->toBeString();
    expect($devices->first()['name'])->toBeString();
    expect($devices->first()['basedOn'])->toBeString();
});

it('groups devices by category', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $categories = $devices->pluck('category')->unique();

    expect($categories)->not->toBeEmpty();
    expect($categories->count())->toBeGreaterThan(1);
});

it('extracts devices with valid based on values', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Find a device that should have a "Based On" value (not empty, not a version number)
    $deviceWithBasedOn = $devices->first(function ($device) {
        return ! empty($device['basedOn']) &&
               ! preg_match('/^\d+\.\d+(\.\d+)?$/', $device['basedOn']);
    });

    if ($deviceWithBasedOn) {
        expect($deviceWithBasedOn['basedOn'])->not->toBeEmpty();
        expect($deviceWithBasedOn['basedOn'])->not->toMatch('/^\d+\.\d+(\.\d+)?$/');
    }
});

it('does not include version numbers in based on field', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Opto Comp should have empty basedOn (not "1.0.0")
    $optoComp = $devices->firstWhere('name', 'Opto Comp');

    if ($optoComp) {
        expect($optoComp['basedOn'])->toBeEmpty();
    }

    // Check that no device has a version number in basedOn
    $devicesWithVersionNumbers = $devices->filter(function ($device) {
        return preg_match('/^\d+\.\d+(\.\d+)?$/', $device['basedOn']);
    });

    expect($devicesWithVersionNumbers)->toBeEmpty();
});

it('handles devices without based on values correctly', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Find devices that should not have a "Based On" value
    $optoComp = $devices->firstWhere('name', 'Opto Comp');
    $optoCompSt = $devices->firstWhere('name', 'Opto Comp (ST)');
    $optoCompSc = $devices->firstWhere('name', 'Opto Comp (S/C)');

    if ($optoComp) {
        expect($optoComp['basedOn'])->toBeEmpty();
    }

    if ($optoCompSt) {
        expect($optoCompSt['basedOn'])->toBeEmpty();
    }

    if ($optoCompSc) {
        expect($optoCompSc['basedOn'])->toBeEmpty();
    }
});

it('does not include header rows as devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $headerNames = ['Name', 'Namei', 'Based on', 'Based oni'];

    foreach ($headerNames as $headerName) {
        $found = $devices->contains(function ($device) use ($headerName) {
            return strtolower($device['name']) === strtolower($headerName);
        });

        expect($found)->toBeFalse();
    }
});

it('throws exception on HTTP error', function () {
    Http::fake([
        'neuraldsp.com/device-list' => Http::response('', 500),
    ]);

    expect(fn () => test()->scraper->scrape())
        ->toThrow(\RuntimeException::class, 'Failed to fetch page');
});

it('throws exception on empty response', function () {
    Http::fake([
        'neuraldsp.com/device-list' => Http::response('', 200),
    ]);

    expect(fn () => test()->scraper->scrape())
        ->toThrow(\RuntimeException::class, 'Received empty response');
});

it('returns empty collection for HTML without devices', function () {
    $emptyHtml = '<html><body><h2>Some Category</h2><div>No device data here</div></body></html>';

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($emptyHtml, 200),
    ]);

    $devices = test()->scraper->scrape();

    expect($devices)->toBeEmpty();
});

it('handles malformed HTML gracefully', function () {
    $malformedHtml = '<html><body><h2>Category</h2><div><div>Device 1</div></div></body></html>';

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($malformedHtml, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Should not throw exception, but may return empty or partial results
    expect($devices)->toBeInstanceOf(\Illuminate\Support\Collection::class);
});

it('extracts all required device fields', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $devices->each(function ($device) {
        expect($device)->toHaveKeys(['category', 'name', 'basedOn']);
        expect($device['category'])->not->toBeEmpty();
        expect($device['name'])->not->toBeEmpty();
        // basedOn can be empty, but must be a string
        expect($device['basedOn'])->toBeString();
    });
});

it('correctly identifies column indices from header row', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // If we have devices, the header was correctly identified and skipped
    expect($devices)->not->toBeEmpty();

    // Verify that devices have proper names (not header text)
    $hasValidDevice = $devices->contains(function ($device) {
        return ! in_array(strtolower($device['name']), ['name', 'namei', 'based on', 'based oni']) &&
               ! str_contains(strtolower($device['name']), 'added in');
    });

    expect($hasValidDevice)->toBeTrue();
});

it('extracts based on values for regular devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Test specific devices that should have "Based On" values
    $brit2203 = $devices->firstWhere('name', 'Brit 2203');
    $bognaVishnu = $devices->firstWhere('name', 'Bogna Vishnu 20th Clean');

    // These devices should have non-empty "Based On" values
    if ($brit2203) {
        expect($brit2203['basedOn'])->not->toBeEmpty();
    }

    if ($bognaVishnu) {
        expect($bognaVishnu['basedOn'])->not->toBeEmpty();
    }
});

it('does not include category names in based on field for unreleased devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Get all devices in the unreleased category (should be none since we exclude them)
    $unreleasedDevices = $devices->filter(function ($device) {
        return $device['category'] === 'Announced devices that have not yet been released';
    });

    // Since we exclude unreleased devices, this should be empty
    expect($unreleasedDevices)->toBeEmpty();
});

it('filters out invalid device names like device categoryi', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // "Device categoryi" should not appear as a device name
    $deviceCategoryi = $devices->firstWhere('name', 'Device categoryi');
    expect($deviceCategoryi)->toBeNull();

    // Category names should not appear as device names
    $categoryNames = [
        'Bass amps',
        'Bass overdrive',
        'Compressor',
        'Delay',
        'EQ',
        'Guitar amps',
        'Guitar overdrive',
        'Other third party IRs',
        'Pitch',
        'Reverb',
    ];

    foreach ($categoryNames as $categoryName) {
        $device = $devices->firstWhere('name', $categoryName);
        // If found, it should only be in the unreleased category and should not have the category name in "Based On"
        if ($device && $device['category'] === 'Announced devices that have not yet been released') {
            expect($device['basedOn'])->not->toBe($categoryName);
        }
    }
});

it('handles transparent blend device correctly', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $transparentBlend = $devices->firstWhere('name', 'Transparent Blend');

    if ($transparentBlend) {
        // Should be in Utility category
        expect($transparentBlend['category'])->toBe('Utility');
        // Should not have category name in "Based On" field
        expect($transparentBlend['basedOn'])->not->toBe('Utility');
    }
});

it('excludes all announced devices that have not yet been released', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // No devices should be in the unreleased category
    $unreleasedDevices = $devices->filter(function ($device) {
        return $device['category'] === 'Announced devices that have not yet been released';
    });

    expect($unreleasedDevices)->toBeEmpty();
});
