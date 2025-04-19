/**
 * This script creates a 512x512 blue square PNG icon from a base64 string
 */

const fs = require("fs");
const path = require("path");

// Create the build directory if it doesn't exist
const buildDir = path.join(__dirname, "build");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Download a blue square image from a data URL
// This is a very simplified blue square - in production you'd want to use a real icon
const iconPath = path.join(buildDir, "icon.png");

// Use fetch to download a simple 512x512 blue square from a placeholder image service
async function downloadIcon() {
  try {
    // Use node-fetch if available
    let fetch;
    try {
      fetch = require("node-fetch");
    } catch (e) {
      // Fall back to global fetch if available (Node.js 18+)
      if (typeof global.fetch === "function") {
        fetch = global.fetch;
      } else {
        throw new Error("No fetch implementation available");
      }
    }

    // Download a blue square placeholder image
    const response = await fetch(
      "https://via.placeholder.com/512x512/007BFF/FFFFFF",
    );

    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(iconPath, Buffer.from(buffer));

    console.log(`Downloaded 512x512 icon to ${iconPath}`);
  } catch (error) {
    console.error("Error downloading icon:", error.message);
    console.log("Falling back to creating a simple icon...");

    // Create a simple HTML file that renders a canvas and saves it
    const htmlPath = path.join(__dirname, "temp-icon-generator.html");
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Icon Generator</title>
      </head>
      <body>
        <canvas id="canvas" width="512" height="512"></canvas>
        <script>
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          
          // Fill with blue
          ctx.fillStyle = '#007BFF';
          ctx.fillRect(0, 0, 512, 512);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
          console.log(dataUrl);
          
          // In a browser this would download the image
          // But in our script we'll just extract the base64 data
        </script>
      </body>
      </html>
    `;

    fs.writeFileSync(htmlPath, html);
    console.log(`Created HTML file for icon generation at ${htmlPath}`);
    console.log(
      "Please open this file in a browser, copy the data URL from the console,",
    );
    console.log("and save it as build/icon.png");

    // Optionally, create a fallback 512x512 blank PNG
    // This is very basic and will only work for some platforms
    console.log("Creating a fallback icon (512x512 blue square)...");

    // Create a simple array filled with blue pixels
    const size = 512 * 512 * 4; // 512x512 pixels, 4 bytes per pixel (RGBA)
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i += 4) {
      buffer[i] = 0x00; // R
      buffer[i + 1] = 0x7b; // G
      buffer[i + 2] = 0xff; // B
      buffer[i + 3] = 0xff; // A
    }

    // Write the buffer to a file
    fs.writeFileSync(iconPath, buffer);
    console.log(`Created fallback icon at ${iconPath}`);
    console.log(
      "WARNING: This fallback icon may not work with Electron Builder.",
    );
    console.log("Consider creating a proper icon using an image editor.");
  }
}

// Run the download
downloadIcon();
