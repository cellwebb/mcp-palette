/**
 * This script makes the shell scripts executable on Unix-like systems.
 */

const fs = require("fs");
const path = require("path");

// Files to make executable
const scriptsToMakeExecutable = [
  "start.sh",
  "build.sh",
  "clean-build.sh",
  "simple-build.sh",
  "rebuild-and-start.sh",
  "fix-and-rebuild.sh",
  "fix-enter-key.sh",
];

// Function to make a file executable
function makeExecutable(filePath) {
  try {
    // Get current file mode
    const stats = fs.statSync(filePath);

    // Add executable permissions (equivalent to chmod +x)
    // 0o755 = rwxr-xr-x (owner: rwx, group: rx, other: rx)
    const newMode = stats.mode | 0o111; // Add executable bit for user, group, and others

    // Set new mode
    fs.chmodSync(filePath, newMode);

    console.log(`Made ${filePath} executable.`);
  } catch (err) {
    console.error(`Error making ${filePath} executable:`, err);
  }
}

// Process all scripts
scriptsToMakeExecutable.forEach((script) => {
  const scriptPath = path.join(__dirname, script);
  if (fs.existsSync(scriptPath)) {
    makeExecutable(scriptPath);
  } else {
    console.warn(`Script ${script} not found.`);
  }
});

console.log("Script execution permissions updated.");
