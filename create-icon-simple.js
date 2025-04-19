/**
 * This script creates a basic PNG icon file from a base64-encoded string
 * This approach requires no external dependencies
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG in blue (base64 encoded)
// In a real scenario, you'd create a proper icon file
const BASE64_BLUE_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Create the build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Write the PNG file
const iconPath = path.join(buildDir, 'icon.png');
fs.writeFileSync(iconPath, Buffer.from(BASE64_BLUE_PIXEL, 'base64'));

console.log(`Created icon file at ${iconPath}`);
console.log('NOTE: This is a placeholder 1x1 pixel. For production, replace with a proper icon.');
