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

# Clean any previous builds
echo "Cleaning previous builds..."
npm run build

# Build the application
echo "Building MCP Server Manager..."
npm run build

# Start the application with electron preview
echo "Starting MCP Server Manager..."
npm run electron:preview