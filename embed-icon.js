/**
 * Creates a simple 512x512 blue icon by embedding a minimal PNG file
 */
const fs = require("fs");
const path = require("path");

// Make sure build directory exists
const buildDir = path.join(__dirname, "build");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Create a minimal PNG with a solid color
// This is a base64-encoded 512x512 blue PNG image
// Generate a new PNG using https://png-pixel.com/ if needed
const base64Image =
  "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEUAe/8XwPhzAAAATklEQVR42u3BMQEAAADCIPuntsYOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICXAcTgAAFjho2KAAAAAElFTkSuQmCC";

// Decode base64 to binary
const imageBuffer = Buffer.from(base64Image, "base64");

// Write to file
const iconPath = path.join(buildDir, "icon.png");
fs.writeFileSync(iconPath, imageBuffer);

console.log(`Created 512x512 blue icon at ${iconPath}`);
