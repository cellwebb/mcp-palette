#!/bin/bash

# Make sure script runs from the right directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this application."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm to run this application."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clean up any previous icon files that might cause issues
echo "Cleaning up build files..."
rm -rf build/icon.*
rm -rf release/

# Build the application
echo "Building MCP Server Manager..."
npm run build

# Use the minimal build approach to avoid issues with icons
echo "Building with minimal configuration..."
node minimal-build.js

echo "Build complete!"
