/**
 * Quickly make our script files executable
 */
const fs = require("fs");
const { execSync } = require("child_process");

try {
  console.log("Making build scripts executable...");

  // Run chmod +x on the scripts
  execSync("chmod +x *.sh", { stdio: "inherit" });

  console.log("All shell scripts are now executable!");
} catch (error) {
  console.error("Error making scripts executable:", error);
}
