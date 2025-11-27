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

    expect($devices->first())->toHaveKeys(['category', 'name', 'basedOn', 'addedInCorOS']);
    expect($devices->first()['category'])->toBeString();
    expect($devices->first()['name'])->toBeString();
    expect($devices->first()['basedOn'])->toBeString();
    expect($devices->first()['addedInCorOS'])->toBeString();
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
        expect($device)->toHaveKeys(['category', 'name', 'basedOn', 'addedInCorOS']);
        expect($device['category'])->not->toBeEmpty();
        expect($device['name'])->not->toBeEmpty();
        // basedOn can be empty, but must be a string
        expect($device['basedOn'])->toBeString();
        // addedInCorOS can be empty, but must be a string
        expect($device['addedInCorOS'])->toBeString();
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

// CorOS 3.3 Tests - Neural Captures V2 has a different structure with 4 columns

it('extracts Neural Captures V2 devices with proper names (not category labels)', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $v2Devices = $devices->where('category', 'Neural Captures V2');

    // V2 should have real device names, not category labels like "Guitar amps"
    $categoryLabels = ['Guitar amps', 'Guitar combo amps', 'Bass amps', 'Compressor', 'Fuzz pedals', 'Guitar overdrive'];

    $hasOnlyCategoryLabels = $v2Devices->every(function ($device) use ($categoryLabels) {
        return in_array($device['name'], $categoryLabels);
    });

    expect($hasOnlyCategoryLabels)->toBeFalse('Neural Captures V2 should contain actual device names, not just category labels');

    // Check for specific device names that should exist in V2
    $expectedDevices = ['Brit 2203 87', 'Dumbbell ODS', 'Chief HM2'];

    foreach ($expectedDevices as $expectedName) {
        $found = $v2Devices->contains('name', $expectedName);
        expect($found)->toBeTrue("Expected to find '{$expectedName}' in Neural Captures V2");
    }
});

it('extracts Neural Captures V2 devices with basedOn values', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $v2Devices = $devices->where('category', 'Neural Captures V2');

    // Find a specific device and check its basedOn value
    $brit220387 = $v2Devices->firstWhere('name', 'Brit 2203 87');

    expect($brit220387)->not->toBeNull('Brit 2203 87 should exist in Neural Captures V2');
    expect($brit220387['basedOn'])->toBe('Marshall® JCM800® 1987');
});

it('extracts Synth category with Mono Synth device', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $synthDevices = $devices->where('category', 'Synth');

    expect($synthDevices)->not->toBeEmpty('Synth category should exist');

    $monoSynth = $synthDevices->firstWhere('name', 'Mono Synth');

    expect($monoSynth)->not->toBeNull('Mono Synth should exist in Synth category');
});

it('correctly identifies Neural Captures V1 as a separate category from V2', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $categories = $devices->pluck('category')->unique();

    expect($categories)->toContain('Neural Captures V1');
    expect($categories)->toContain('Neural Captures V2');
    expect($categories)->not->toContain('Neural Captures'); // Old category should not exist
});

// Added in CorOS tests

it('extracts devices with addedInCorOS field', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    expect($devices->first())->toHaveKeys(['category', 'name', 'basedOn', 'addedInCorOS']);
    expect($devices->first()['addedInCorOS'])->toBeString();
});

it('extracts addedInCorOS version for Neural Captures V2 devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $v2Devices = $devices->where('category', 'Neural Captures V2');

    // Brit 2203 87 should have addedInCorOS = '3.3.0'
    $brit220387 = $v2Devices->firstWhere('name', 'Brit 2203 87');

    expect($brit220387)->not->toBeNull('Brit 2203 87 should exist in Neural Captures V2');
    expect($brit220387['addedInCorOS'])->toBe('3.3.0');
});

it('extracts addedInCorOS for non-V2 categories', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Guitar amps devices should also have addedInCorOS values
    $guitarAmpDevice = $devices->firstWhere('category', 'Guitar amps');

    expect($guitarAmpDevice)->not->toBeNull();
    expect($guitarAmpDevice['addedInCorOS'])->toMatch('/^\d+\.\d+(\.\d+)?$/');
});

it('extracts addedInCorOS for 2-column categories without basedOn', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // IR loader, Looper, Utility have only Name and Added in CorOS columns
    $irLoaderDevice = $devices->firstWhere('category', 'IR loader');

    expect($irLoaderDevice)->not->toBeNull();
    expect($irLoaderDevice['name'])->not->toBeEmpty();
    expect($irLoaderDevice['basedOn'])->toBeEmpty();
    expect($irLoaderDevice['addedInCorOS'])->toMatch('/^\d+\.\d+(\.\d+)?$/');
});

it('extracts deviceCategory for Neural Captures V2 devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $v2Devices = $devices->where('category', 'Neural Captures V2');

    // V2 devices should have deviceCategory field
    $deviceWithCategory = $v2Devices->first(function ($device) {
        return isset($device['deviceCategory']) && ! empty($device['deviceCategory']);
    });

    expect($deviceWithCategory)->not->toBeNull('V2 devices should have deviceCategory field');
    expect($deviceWithCategory['deviceCategory'])->toBeString();
    expect($deviceWithCategory['deviceCategory'])->not->toBeEmpty();
});

it('extracts previousName and updatedInCorOS for Neural Captures V1 devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    $v1Devices = $devices->where('category', 'Neural Captures V1');

    // Find a V1 device that has previousName or updatedInCorOS
    $deviceWithMetadata = $v1Devices->first(function ($device) {
        return (isset($device['previousName']) && ! empty($device['previousName'])) ||
               (isset($device['updatedInCorOS']) && ! empty($device['updatedInCorOS']));
    });

    if ($deviceWithMetadata) {
        if (isset($deviceWithMetadata['previousName'])) {
            expect($deviceWithMetadata['previousName'])->toBeString();
        }
        if (isset($deviceWithMetadata['updatedInCorOS'])) {
            expect($deviceWithMetadata['updatedInCorOS'])->toMatch('/^\d+\.\d+(\.\d+)?$/');
        }
    }
});

it('only includes deviceCategory for V2 and Plugin devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Only V2 and Plugin devices should have deviceCategory
    $categoriesWithDeviceCategory = ['Neural Captures V2', 'Plugin devices'];

    $devicesWithCategory = $devices->filter(function ($device) {
        return isset($device['deviceCategory']);
    });

    $invalidDevices = $devicesWithCategory->filter(function ($device) use ($categoriesWithDeviceCategory) {
        return ! in_array($device['category'], $categoriesWithDeviceCategory);
    });

    expect($invalidDevices)->toBeEmpty('Only V2 and Plugin devices should have deviceCategory');
});

it('only includes pluginSource for Plugin devices', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Only Plugin devices should have pluginSource
    $devicesWithPluginSource = $devices->filter(function ($device) {
        return isset($device['pluginSource']);
    });

    $invalidDevices = $devicesWithPluginSource->filter(function ($device) {
        return $device['category'] !== 'Plugin devices';
    });

    expect($invalidDevices)->toBeEmpty('Only Plugin devices should have pluginSource');
});

it('extracts previousName and updatedInCorOS for 5-column categories', function () {
    $html = file_get_contents(test()->fixturePath);

    Http::fake([
        'neuraldsp.com/device-list' => Http::response($html, 200),
    ]);

    $devices = test()->scraper->scrape();

    // Categories with 5-column schema can have previousName and updatedInCorOS
    $categoriesWithExtendedSchema = [
        'Neural Captures V1',
        'Guitar amps',
        'Guitar cabinets',
        'Guitar overdrive',
        'Bass amps',
        'Bass cabinets',
        'Bass overdrive',
        'Delay',
        'Reverb',
        'Compressor',
        'Pitch',
        'Modulation',
        'Morph',
        'Filter',
        'EQ',
        'Wah',
        'Synth',
    ];

    $devicesWithExtendedFields = $devices->filter(function ($device) {
        return isset($device['previousName']) || isset($device['updatedInCorOS']);
    });

    $invalidDevices = $devicesWithExtendedFields->filter(function ($device) use ($categoriesWithExtendedSchema) {
        return ! in_array($device['category'], $categoriesWithExtendedSchema);
    });

    expect($invalidDevices)->toBeEmpty('Only 5-column categories should have previousName or updatedInCorOS');
});
