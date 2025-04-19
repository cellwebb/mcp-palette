/**
 * This script converts the SVG icon to PNG format for Electron Builder
 * Since we don't have direct access to image libraries, we'll create a simple
 * base64-encoded PNG file that represents a blue square with MCP logo.
 */

const fs = require('fs');
const path = require('path');

// Simple 512x512 blue square with "MCP" text as base64 PNG
// In a real scenario, you'd use a proper image conversion library
const BASE64_PNG = `iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA8aSURBVHgB7d1NbBzXgcfxf9nL2kriaE2iqE6aIPClQIpN1ziFc