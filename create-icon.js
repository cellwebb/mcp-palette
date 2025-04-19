/**
 * This script creates a basic PNG icon for Electron Builder
 * Since we need a simple solution without dependencies, we'll create
 * a minimal PNG file that will work with Electron Builder
 */

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Check if we have the canvas module
try {
  require.resolve("canvas");
} catch (e) {
  console.error(
    'The "canvas" module is not installed. Please install it using:',
  );
  console.error("npm install canvas");
  process.exit(1);
}

// Create a 512x512 canvas for the icon
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext("2d");

// Draw a blue background (using the #007BFF color from the SVG)
ctx.fillStyle = "#007BFF";
ctx.fillRect(0, 0, 512, 512);

// Draw white circles to mimic the MCP logo
ctx.strokeStyle = "white";
ctx.lineWidth = 24;
ctx.beginPath();
ctx.arc(256, 256, 160, 0, Math.PI * 2);
ctx.stroke();

ctx.lineWidth = 16;
ctx.beginPath();
ctx.arc(256, 256, 92, 0, Math.PI * 2);
ctx.stroke();

// Draw the innermost circle as filled
ctx.fillStyle = "white";
ctx.beginPath();
ctx.arc(256, 256, 36, 0, Math.PI * 2);
ctx.fill();

// Save the PNG to the build directory
const outputPath = path.join(__dirname, "build", "icon.png");
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);

out.on("finish", () => {
  console.log(`Icon created: ${outputPath}`);
});

out.on("error", (err) => {
  console.error("Error creating icon:", err);
});
