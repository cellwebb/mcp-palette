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

# Parse command line arguments
PLATFORM=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --mac)
            PLATFORM="mac"
            shift
            ;;
        --windows)
            PLATFORM="win"
            shift
            ;;
        --linux)
            PLATFORM="linux"
            shift
            ;;
        --all)
            PLATFORM="all"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./build.sh [--mac|--windows|--linux|--all]"
            exit 1
            ;;
    esac
done

# Create the icon
echo "Creating icon..."
node create-icon-simple.js

# Build the application
echo "Building MCP Server Manager..."
npm run build

# Build the electron app for the specified platform
if [ -n "$PLATFORM" ]; then
    case $PLATFORM in
        mac)
            echo "Building for macOS..."
            npx electron-builder --mac
            ;;
        win)
            echo "Building for Windows..."
            npx electron-builder --win
            ;;
        linux)
            echo "Building for Linux..."
            npx electron-builder --linux
            ;;
        all)
            echo "Building for all platforms..."
            npx electron-builder --mac --win --linux
            ;;
    esac
else
    # No platform specified, build for current platform
    echo "Building for current platform..."
    npx electron-builder
fi

echo "Build complete!"