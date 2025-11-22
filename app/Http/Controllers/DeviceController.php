<?php

namespace App\Http\Controllers;

use App\CacheKey;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DeviceController extends Controller
{
    /**
     * Display the device list page.
     */
    public function index()
    {
        $devices = $this->getDevices();
        $categories = $this->getCategories($devices);

        return Inertia::render('welcome', [
            'categories' => $categories,
            'devices' => \Inertia\Inertia::defer(fn () => $devices->values()->all()),
        ]);
    }

    /**
     * Get devices from cache or JSON file.
     *
     * @return \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>
     */
    protected function getDevices(): Collection
    {
        return Cache::remember(CacheKey::DevicesList->value, 3600, function () {
            $path = storage_path('app/devices.json');

            if (! file_exists($path)) {
                return collect();
            }

            $json = file_get_contents($path);
            $data = json_decode($json, true);

            if (! is_array($data)) {
                return collect();
            }

            return collect($data);
        });
    }

    /**
     * Get unique categories from devices.
     *
     * @param  \Illuminate\Support\Collection<int, array{category: string, name: string, basedOn: string}>  $devices
     * @return array<int, string>
     */
    protected function getCategories(Collection $devices): array
    {
        return $devices
            ->pluck('category')
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
