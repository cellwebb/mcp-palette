#!/bin/bash

# Make sure script runs from the right directory
cd "$(dirname "$0")"

# Ensure proper environment
export NODE_ENV=development

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/

# Rebuild the application
echo "Building MCP Palette..."
npm run build

# Start the application to test
echo "Starting MCP Palette..."
npm run electron:preview
