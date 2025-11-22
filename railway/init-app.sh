#!/bin/bash
# Make sure this file has executable permissions, run `chmod +x railway/init-app.sh`
# Exit the script if any command fails
set -e

# Ensure storage directories exist (safe even if volume is mounted to storage/)
mkdir -p storage/app
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs

# Run migrations
php artisan migrate --force

# Clear cache
php artisan optimize:clear

# Cache the various components of the Laravel application
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

