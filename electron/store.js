/**
 * This module provides a centralized store instance for the application
 * to ensure consistent access to the electron-store throughout the app.
 */

const Store = require("electron-store");
const { app } = require("electron");
const path = require("path");
const fs = require("fs");

/**
 * Generates a UUID v4 string
 * This is a lightweight implementation that doesn't require additional dependencies
 * @returns {string} A UUID v4 formatted string
 */
function generateUUID() {
  // Implementation based on RFC4122 version 4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if a string is a valid UUID v4
 * @param {string} uuid - The string to validate as a UUID
 * @returns {boolean} True if the string is a valid UUID v4
 */
function isValidUUID(uuid) {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

// Define the default schema and configurations
const schema = {
  serverMasterList: {
    type: "object",
    default: {},
  },
  profiles: {
    type: "array",
    default: [
      {
        id: generateUUID(),
        name: "Default",
        servers: {},
      },
    ],
  },
  activeProfile: {
    type: "string",
    default: "Default",
  },
  // New field to track the store version
  storeVersion: {
    type: "string",
    default: "1.0.0",
  },
};

// Create the store instance with defaults
const store = new Store({
  name: "mcp-profiles",
  schema,
  migrations: {
    // Add any migrations for future versions here
    "1.0.0": (store) => {
      // Example migration from older formats
      if (!store.has("serverMasterList")) {
        // Handle legacy format without server master list
        const profiles = store.get("profiles");
        if (Array.isArray(profiles)) {
          const serverMasterList = {};

          // Extract servers to master list
          profiles.forEach((profile) => {
            if (profile.servers) {
              Object.entries(profile.servers).forEach(
                ([serverId, serverConfig]) => {
                  if (!serverMasterList[serverId]) {
                    serverMasterList[serverId] = serverConfig;
                  }
                },
              );
            }
          });

          store.set("serverMasterList", serverMasterList);
        }
      }
    },
    // New migration for adding UUIDs
    "2.0.0": (store) => {
      console.log("Running migration to add UUIDs to servers and profiles");

      // Migrate server master list to use UUIDs
      const serverMasterList = store.get("serverMasterList") || {};
      const serverIdMap = {}; // Map old IDs to new UUIDs
      const newServerMasterList = {};

      // Generate UUIDs for each server in the master list
      Object.entries(serverMasterList).forEach(([oldId, serverConfig]) => {
        // Skip if the server already has a valid UUID
        if (isValidUUID(oldId)) {
          newServerMasterList[oldId] = serverConfig;
          serverIdMap[oldId] = oldId;
          return;
        }

        // Generate a new UUID for this server
        const newId = generateUUID();
        serverIdMap[oldId] = newId;

        // Copy the server config to the new ID
        newServerMasterList[newId] = {
          ...serverConfig,
          // Store original name/id as a reference
          originalId: oldId,
        };
      });

      // Update the server master list
      store.set("serverMasterList", newServerMasterList);

      // Migrate profiles to use UUIDs
      const profiles = store.get("profiles") || [];
      const newProfiles = [];
      const profileIdMap = {}; // Map profile names to UUIDs

      // Generate UUIDs for each profile
      profiles.forEach((profile) => {
        // Skip if the profile already has a UUID
        if (profile.id && isValidUUID(profile.id)) {
          // Still need to update server references
          if (profile.servers) {
            const newServers = {};
            Object.entries(profile.servers).forEach(
              ([oldServerId, serverConfig]) => {
                const newServerId = serverIdMap[oldServerId] || oldServerId;
                newServers[newServerId] = serverConfig;
              },
            );
            profile.servers = newServers;
          }

          newProfiles.push(profile);
          profileIdMap[profile.name] = profile.id;
          return;
        }

        // Generate a new UUID for this profile
        const newProfileId = generateUUID();
        profileIdMap[profile.name] = newProfileId;

        // Create a new profile with the UUID
        const newProfile = {
          ...profile,
          id: newProfileId,
        };

        // Update server references to use new UUIDs
        if (newProfile.servers) {
          const newServers = {};
          Object.entries(newProfile.servers).forEach(
            ([oldServerId, serverConfig]) => {
              const newServerId = serverIdMap[oldServerId] || oldServerId;
              newServers[newServerId] = serverConfig;
            },
          );
          newProfile.servers = newServers;
        }

        newProfiles.push(newProfile);
      });

      // Update profiles
      store.set("profiles", newProfiles);

      // Update store version
      store.set("storeVersion", "2.0.0");

      console.log("Migration to UUIDs completed successfully");

      // Create a backup of the ID mappings
      try {
        const backupDir = path.join(app.getPath("userData"), "backups");
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupPath = path.join(
          backupDir,
          `uuid-migration-${Date.now()}.json`,
        );
        fs.writeFileSync(
          backupPath,
          JSON.stringify(
            {
              serverIdMap,
              profileIdMap,
              migrationDate: new Date().toISOString(),
            },
            null,
            2,
          ),
        );

        console.log(`UUID migration mapping backed up to: ${backupPath}`);
      } catch (error) {
        console.error("Failed to create UUID migration backup:", error);
      }
    },
  },
});

/**
 * Runs migrations to ensure the store is up to date
 */
function runMigrations() {
  const currentVersion = store.get("storeVersion") || "1.0.0";

  // Run migrations based on version
  if (currentVersion === "1.0.0") {
    // Upgrade to 2.0.0 (UUID migration)
    store.get("migrations.2.0.0")(store);
  }
}

/**
 * Sets up default MCP servers if not already present
 * @param {boolean} force - If true, will reset to defaults even if data exists
 */
function setupDefaultProfiles(force = false) {
  // Run migrations first
  runMigrations();

  // Only set up defaults if this is the first run or force is true
  const currentServerMasterList = store.get("serverMasterList");
  const currentProfiles = store.get("profiles");

  if (
    force ||
    Object.keys(currentServerMasterList).length === 0 ||
    (currentProfiles.length === 1 &&
      Object.keys(currentProfiles[0].servers).length === 0)
  ) {
    // Setup default server master list with UUIDs
    const filesystemId = generateUUID();
    const memoryId = generateUUID();
    const puppeteerId = generateUUID();
    const sequentialThinkingId = generateUUID();

    const defaultServerMasterList = {
      [filesystemId]: {
        name: "filesystem",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
        env: {
          BASE_DIRS: `${app.getPath("home")}/Documents,${app.getPath("home")}/Downloads`,
        },
        originalId: "filesystem",
      },
      [memoryId]: {
        name: "memory",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
        env: {
          MEMORY_FILE_PATH: `${app.getPath("userData")}/.mcp-memory.json`,
        },
        originalId: "memory",
      },
      [puppeteerId]: {
        name: "puppeteer",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        env: {
          PUPPETEER_LAUNCH_OPTIONS: '{ "headless": false}',
          ALLOW_DANGEROUS: "false",
        },
        originalId: "puppeteer",
      },
      [sequentialThinkingId]: {
        name: "sequential-thinking",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        env: {},
        originalId: "sequential-thinking",
      },
    };

    // Create profiles with UUIDs and server references
    const defaultProfiles = [
      {
        id: generateUUID(),
        name: "Default",
        servers: {},
      },
      {
        id: generateUUID(),
        name: "Basic",
        servers: {
          [filesystemId]: {
            enabled: true,
            overrides: {},
          },
          [memoryId]: {
            enabled: true,
            overrides: {},
          },
        },
      },
      {
        id: generateUUID(),
        name: "Complete",
        servers: {
          [filesystemId]: {
            enabled: true,
            overrides: {},
          },
          [memoryId]: {
            enabled: true,
            overrides: {},
          },
          [puppeteerId]: {
            enabled: true,
            overrides: {},
          },
          [sequentialThinkingId]: {
            enabled: true,
            overrides: {},
          },
        },
      },
    ];

    // Update store with defaults
    store.set("serverMasterList", defaultServerMasterList);
    store.set("profiles", defaultProfiles);
    store.set("storeVersion", "2.0.0");
  }
}

/**
 * Helper function to merge master server with profile overrides
 * @param {string} serverId - The server ID
 * @param {Object} profileOverrides - Profile-specific overrides
 * @returns {Object} The merged configuration
 */
function getMergedServerConfig(serverId, profileOverrides) {
  const master = store.get(`serverMasterList.${serverId}`);

  if (!master) return null;

  if (!profileOverrides) {
    return { ...master, enabled: false };
  }

  const { enabled, overrides } = profileOverrides;

  // Deep merge the master with overrides
  const merged = { ...master };

  // Apply overrides
  if (overrides) {
    if (overrides.name) merged.name = overrides.name;
    if (overrides.command) merged.command = overrides.command;

    if (overrides.args) {
      merged.args = [...overrides.args];
    }

    if (overrides.env) {
      merged.env = { ...merged.env, ...overrides.env };
    }
  }

  // Add enabled flag
  merged.enabled = !!enabled;

  return merged;
}

/**
 * Get a profile by ID or name
 * @param {string} identifier - Profile ID or name
 * @returns {Object|null} The profile object or null if not found
 */
function getProfileByIdOrName(identifier) {
  const profiles = store.get("profiles");

  // Try to find by ID first
  let profile = profiles.find((p) => p.id === identifier);

  // If not found by ID, try by name
  if (!profile) {
    profile = profiles.find((p) => p.name === identifier);
  }

  return profile || null;
}

/**
 * Find a server by original ID or name
 * @param {string} originalIdOrName - Original server ID or name
 * @returns {string|null} The UUID of the server or null if not found
 */
function findServerByOriginalId(originalIdOrName) {
  const serverMasterList = store.get("serverMasterList");

  // If it's already a UUID, return it directly
  if (isValidUUID(originalIdOrName) && serverMasterList[originalIdOrName]) {
    return originalIdOrName;
  }

  // Search by originalId or name
  for (const [uuid, server] of Object.entries(serverMasterList)) {
    if (
      server.originalId === originalIdOrName ||
      server.name === originalIdOrName
    ) {
      return uuid;
    }
  }

  return null;
}

module.exports = {
  store,
  setupDefaultProfiles,
  runMigrations,
  getMergedServerConfig,
  getProfileByIdOrName,
  findServerByOriginalId,
  generateUUID,
  isValidUUID,
};
