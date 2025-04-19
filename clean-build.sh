#!/bin/bash

# Make sure script runs from the right directory
cd "$(dirname "$0")"

echo "Cleaning up build directory..."
# Remove any existing icon files
rm -rf build/icon.*

echo "Building application..."
npm run electron:build

echo "Build process complete!"
