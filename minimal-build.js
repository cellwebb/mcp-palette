/**
 * This is a minimal build script that uses the electron-builder API directly
 * instead of the CLI, which gives us more control over the build process.
 */

const builder = require("electron-builder");
const path = require("path");

// Minimal configuration
const config = {
  appId: "com.electron.mcp-manager",
  productName: "MCP Manager",
  files: ["dist/**/*", "electron/**/*"],
  directories: {
    output: path.join(__dirname, "release"),
  },
  mac: {
    target: "dir",
    identity: null, // Skip signing
  },
};

// Build function
async function buildApp() {
  console.log("Building with minimal configuration...");

  try {
    await builder.build({
      config: config,
      targets: builder.Platform.MAC.createTarget("dir"),
    });

    console.log("Build complete! Output at:", path.join(__dirname, "release"));
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Run the build
buildApp();
