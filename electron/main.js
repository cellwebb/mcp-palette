const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { createAppMenu } = require("./menu");
const path = require("path");
const fs = require("fs");
const {
  store,
  setupDefaultProfiles,
  runMigrations,
  getMergedServerConfig,
  getProfileByIdOrName,
  findServerByOriginalId,
  generateUUID,
  isValidUUID,
} = require("./store");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // Disable prompt, confirm and alert dialogs
      enableRemoteModule: false,
    },
    backgroundColor: "#ffffff",
    show: false,
  });

  // Disable native dialogs
  mainWindow.webContents.on("did-create-window", (childWindow) => {
    childWindow.webContents.on("will-prevent-unload", (event) => {
      event.preventDefault();
    });
  });

  // In development mode, load from vite dev server
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Wait for the content to load before showing the window
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Setup the application menu
function setupAppMenu() {
  const menu = createAppMenu({
    setupDefaultProfiles,
    createUserMcpServersProfile,
  });

  Menu.setApplicationMenu(menu);
}

// Function to create a profile with user-specific MCP servers
function createUserMcpServersProfile() {
  const username = process.env.USER || process.env.USERNAME || "user";
  const homePath = app.getPath("home");

  // Get filesystem and memory servers
  const serverMasterList = store.get("serverMasterList");
  let filesystemId = null;
  let memoryId = null;

  // Find server UUIDs by original ID or name
  for (const [uuid, server] of Object.entries(serverMasterList)) {
    if (server.originalId === "filesystem" || server.name === "filesystem") {
      filesystemId = uuid;
    } else if (server.originalId === "memory" || server.name === "memory") {
      memoryId = uuid;
    }
  }

  // If servers not found, create them
  if (!filesystemId) {
    filesystemId = generateUUID();
    serverMasterList[filesystemId] = {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
      env: {
        BASE_DIRS: `${homePath}/Documents,${homePath}/Downloads`,
      },
      originalId: "filesystem",
    };
  }

  if (!memoryId) {
    memoryId = generateUUID();
    serverMasterList[memoryId] = {
      name: "memory",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
      env: {
        MEMORY_FILE_PATH: `${homePath}/.mcp-memory.json`,
      },
      originalId: "memory",
    };
  }

  // Update server master list
  store.set("serverMasterList", serverMasterList);

  // Create profile with references to master servers but with custom overrides
  const profiles = store.get("profiles");
  const profileName = `${username}'s MCP Servers`;

  const userProfile = {
    id: generateUUID(),
    name: profileName,
    servers: {
      [filesystemId]: {
        enabled: true,
        overrides: {
          env: {
            BASE_DIRS: `${homePath}/Documents,${homePath}/Downloads,${homePath}/projects`,
          },
        },
      },
      [memoryId]: {
        enabled: true,
        overrides: {
          env: {
            MEMORY_FILE_PATH: `${homePath}/.mcp-memory.json`,
          },
        },
      },
    },
  };

  // Check if the profile already exists
  const existingIndex = profiles.findIndex((p) => p.name === profileName);
  if (existingIndex !== -1) {
    // Update existing profile but keep its ID
    userProfile.id = profiles[existingIndex].id;
    profiles[existingIndex] = userProfile;
  } else {
    // Create new profile
    profiles.push(userProfile);
  }

  store.set("profiles", profiles);

  // Notify the renderer
  if (mainWindow) {
    mainWindow.webContents.send("profiles-updated");
  }

  // Show confirmation dialog
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Profile Created",
      message: `Created profile "${profileName}" with your user-specific MCP servers.`,
      buttons: ["OK"],
    });
  }
}

// Set NODE_ENV
process.env.NODE_ENV = app.isPackaged ? "production" : "development";

// App lifecycle
app.whenReady().then(() => {
  // Run migrations to ensure store is up to date
  runMigrations();

  // Set up default profiles
  setupDefaultProfiles();

  // Set up app menu
  setupAppMenu();

  // Create the window
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers for server master list
ipcMain.handle("get-server-master-list", async () => {
  return store.get("serverMasterList");
});

ipcMain.handle("add-master-server", async (event, serverData) => {
  const serverMasterList = store.get("serverMasterList");

  // Generate UUID if not provided
  const serverId = serverData.id || generateUUID();

  // Create a copy of the server data without the ID
  const serverCopy = { ...serverData };
  delete serverCopy.id;

  // Add original ID reference if it's a new server
  if (!serverData.id) {
    serverCopy.originalId = serverCopy.name;
  }

  // Add server to master list
  serverMasterList[serverId] = serverCopy;
  store.set("serverMasterList", serverMasterList);

  return serverMasterList;
});

ipcMain.handle(
  "update-master-server",
  async (event, { serverId, updatedServer }) => {
    const serverMasterList = store.get("serverMasterList");

    // Ensure the server exists
    if (serverMasterList[serverId]) {
      // Preserve the originalId if it exists
      if (serverMasterList[serverId].originalId) {
        updatedServer.originalId = serverMasterList[serverId].originalId;
      }

      serverMasterList[serverId] = updatedServer;
      store.set("serverMasterList", serverMasterList);
    }

    return serverMasterList;
  },
);

ipcMain.handle("delete-master-server", async (event, serverId) => {
  const serverMasterList = store.get("serverMasterList");

  // Ensure the server exists
  if (serverMasterList[serverId]) {
    delete serverMasterList[serverId];
    store.set("serverMasterList", serverMasterList);

    // Also remove this server from all profiles
    const profiles = store.get("profiles");
    profiles.forEach((profile) => {
      if (profile.servers && profile.servers[serverId]) {
        delete profile.servers[serverId];
      }
    });
    store.set("profiles", profiles);
  }

  return serverMasterList;
});

// IPC Handlers for profile management
ipcMain.handle("get-profiles", async () => {
  return store.get("profiles");
});

ipcMain.handle("get-active-profile", async () => {
  return store.get("activeProfile");
});

ipcMain.handle("set-active-profile", async (event, profileId) => {
  // Find the profile by ID or name
  const profile = getProfileByIdOrName(profileId);

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  // Store the profile name as active profile
  store.set("activeProfile", profile.name);

  return profile.name;
});

ipcMain.handle("add-profile", async (event, profile) => {
  console.log("Adding profile:", profile);

  try {
    const profiles = store.get("profiles");

    // Ensure profile has an ID
    if (!profile.id) {
      profile.id = generateUUID();
    }

    // Make sure name is valid
    if (
      !profile.name ||
      typeof profile.name !== "string" ||
      !profile.name.trim()
    ) {
      throw new Error("Profile name cannot be empty");
    }

    // Check for duplicate names
    if (
      profiles.some((p) => p.name.toLowerCase() === profile.name.toLowerCase())
    ) {
      throw new Error(
        `A profile with the name "${profile.name}" already exists`,
      );
    }

    // Ensure servers is initialized
    if (!profile.servers) {
      profile.servers = {};
    }

    // Add profile
    profiles.push(profile);
    store.set("profiles", profiles);

    // If this is the first profile, set it as active
    if (profiles.length === 1) {
      store.set("activeProfile", profile.name);
    }

    console.log("Profile added successfully:", profile.name);

    // Send notification
    if (mainWindow) {
      mainWindow.webContents.send("profiles-updated");
    }

    return profiles;
  } catch (error) {
    console.error("Error adding profile:", error);
    throw error;
  }
});

ipcMain.handle(
  "update-profile",
  async (event, { profileName, updatedProfile }) => {
    const profiles = store.get("profiles");

    // Find the profile by name
    const index = profiles.findIndex((p) => p.name === profileName);

    if (index !== -1) {
      // Preserve the profile ID
      updatedProfile.id = profiles[index].id;

      profiles[index] = updatedProfile;
      store.set("profiles", profiles);
    }

    return profiles;
  },
);

ipcMain.handle("rename-profile", async (event, { oldName, newName }) => {
  console.log("rename-profile handler called with:", { oldName, newName });

  // Validate input parameters
  if (!oldName) {
    console.error("Original profile name cannot be empty");
    throw new Error("Original profile name cannot be empty");
  }

  // Ensure newName is trimmed
  newName = newName ? newName.trim() : "";

  if (!newName) {
    console.error("New profile name cannot be empty");
    throw new Error("New profile name cannot be empty");
  }

  // Early return for no change (not an error)
  if (newName === oldName) {
    console.log("No change in name, returning current profiles");
    return store.get("profiles");
  }

  try {
    const profiles = store.get("profiles");
    console.log(
      "Current profiles:",
      profiles.map((p) => p.name),
    );

    // Check if the new name already exists (case-insensitive)
    if (
      profiles.some(
        (p) =>
          p.name.toLowerCase() === newName.toLowerCase() && p.name !== oldName,
      )
    ) {
      console.error(`A profile with the name "${newName}" already exists`);
      throw new Error(`A profile with the name "${newName}" already exists`);
    }

    // Find the profile with the old name
    const index = profiles.findIndex((p) => p.name === oldName);
    console.log("Found profile index:", index);

    if (index === -1) {
      console.error(`Profile "${oldName}" not found`);
      throw new Error(`Profile "${oldName}" not found`);
    }

    // Update the profile name but preserve the ID
    profiles[index].name = newName;
    console.log(`Renamed profile from "${oldName}" to "${newName}"`);

    // Create a deep copy to ensure we're not returning a reference
    const profilesCopy = JSON.parse(JSON.stringify(profiles));

    // Save the updated profiles
    store.set("profiles", profilesCopy);
    console.log("Saved updated profiles");

    // Send notification about profile update to any listening windows
    if (mainWindow) {
      mainWindow.webContents.send("profiles-updated");
    }

    // If this is the active profile, update the active profile name
    if (store.get("activeProfile") === oldName) {
      console.log(`Updating active profile from "${oldName}" to "${newName}"`);
      store.set("activeProfile", newName);
    }

    console.log("Returning updated profiles");
    return profilesCopy;
  } catch (error) {
    console.error("Error during profile rename:", error.message);
    throw error; // Re-throw to be handled by the renderer
  }
});

ipcMain.handle("delete-profile", async (event, profileId) => {
  try {
    console.log(`delete-profile handler called with: ${profileId}`);

    // Find the profile by ID or name
    const profile = getProfileByIdOrName(profileId);

    if (!profile) {
      console.error(`Profile not found: ${profileId}`);
      throw new Error(`Profile not found: ${profileId}`);
    }

    const profileName = profile.name;

    // Validate input
    if (!profileName) {
      console.error("Profile name cannot be empty");
      throw new Error("Profile name cannot be empty");
    }

    // Get current profiles
    let profiles = store.get("profiles");
    console.log(`Current profiles count: ${profiles.length}`);

    // Check if we have enough profiles to delete one
    if (profiles.length <= 1) {
      console.error("Cannot delete the last remaining profile");
      throw new Error("Cannot delete the last remaining profile");
    }

    // Filter out the profile to delete
    const updatedProfiles = profiles.filter((p) => p.name !== profileName);
    console.log(`After filter: ${updatedProfiles.length} profiles remaining`);

    // Create a deep copy to avoid reference issues
    const profilesCopy = JSON.parse(JSON.stringify(updatedProfiles));

    // Save the updated profiles
    store.set("profiles", profilesCopy);
    console.log("Saved updated profiles after deletion");

    // Check if we need to update active profile
    const currentActiveProfile = store.get("activeProfile");
    if (currentActiveProfile === profileName) {
      console.log(
        `Active profile "${currentActiveProfile}" was deleted, switching to first available`,
      );
      // Set first available profile as active
      store.set("activeProfile", profilesCopy[0].name);
      console.log(`New active profile: ${profilesCopy[0].name}`);
    }

    console.log("Delete profile operation completed successfully");
    return profilesCopy;
  } catch (error) {
    console.error("Error during profile deletion:", error.message);
    throw error; // Re-throw to be handled by the renderer
  }
});

// Handler for getting merged server configuration
ipcMain.handle(
  "get-effective-server-config",
  async (event, { serverId, profileId }) => {
    // Find the profile by ID or name
    const profile = getProfileByIdOrName(profileId);

    if (!profile) return null;

    // Get server by UUID or original ID
    const serverUUID =
      isValidUUID(serverId) && store.get(`serverMasterList.${serverId}`)
        ? serverId
        : findServerByOriginalId(serverId);

    if (!serverUUID) return null;

    return getMergedServerConfig(serverUUID, profile.servers[serverUUID]);
  },
);

// IPC Handlers for import/export functionality
ipcMain.handle("export-config", async () => {
  const result = await dialog.showSaveDialog({
    title: "Export Configuration",
    defaultPath: path.join(app.getPath("downloads"), "mcp-config.json"),
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });

  if (!result.canceled) {
    const config = {
      serverMasterList: store.get("serverMasterList"),
      profiles: store.get("profiles"),
      storeVersion: store.get("storeVersion") || "2.0.0",
    };

    fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
    return true;
  }
  return false;
});

ipcMain.handle("import-config", async () => {
  const result = await dialog.showOpenDialog({
    title: "Import Configuration",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
    properties: ["openFile"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const data = fs.readFileSync(result.filePaths[0], "utf8");
      const importedConfig = JSON.parse(data);

      // Handle both old and new format imports
      if (importedConfig.serverMasterList) {
        // Check if imported config has UUIDs
        let hasUUIDs = true;

        // Check if server keys are UUIDs
        if (Object.keys(importedConfig.serverMasterList).length > 0) {
          const firstServerId = Object.keys(importedConfig.serverMasterList)[0];
          if (!isValidUUID(firstServerId)) {
            hasUUIDs = false;
          }
        }

        // Check if profiles have IDs
        if (importedConfig.profiles && importedConfig.profiles.length > 0) {
          if (!importedConfig.profiles[0].id) {
            hasUUIDs = false;
          }
        }

        if (!hasUUIDs) {
          // Convert to UUID format
          const serverIdMap = {};
          const newServerMasterList = {};

          // Convert servers
          Object.entries(importedConfig.serverMasterList).forEach(
            ([oldId, serverConfig]) => {
              const newId = generateUUID();
              serverIdMap[oldId] = newId;

              newServerMasterList[newId] = {
                ...serverConfig,
                originalId: oldId,
              };
            },
          );

          // Convert profiles
          const newProfiles = importedConfig.profiles.map((profile) => {
            const newProfile = {
              ...profile,
              id: generateUUID(),
              servers: {},
            };

            // Update server references
            if (profile.servers) {
              Object.entries(profile.servers).forEach(
                ([oldServerId, serverConfig]) => {
                  const newServerId = serverIdMap[oldServerId];
                  if (newServerId) {
                    newProfile.servers[newServerId] = serverConfig;
                  }
                },
              );
            }

            return newProfile;
          });

          // Update store
          store.set("serverMasterList", newServerMasterList);
          store.set("profiles", newProfiles);
          store.set("storeVersion", "2.0.0");
        } else {
          // Already has UUIDs, just import directly
          store.set("serverMasterList", importedConfig.serverMasterList);
          store.set("profiles", importedConfig.profiles);

          // Update store version if provided
          if (importedConfig.storeVersion) {
            store.set("storeVersion", importedConfig.storeVersion);
          } else {
            store.set("storeVersion", "2.0.0");
          }
        }
      } else if (Array.isArray(importedConfig)) {
        // Legacy format - just profiles array
        // Convert to new format with UUIDs
        const serverMasterList = {};
        const profiles = [];
        const serverIdMap = {};

        importedConfig.forEach((profile) => {
          const newProfile = {
            id: generateUUID(),
            name: profile.name,
            servers: {},
          };

          // Extract servers to master list and convert profile to reference them
          if (profile.servers) {
            Object.entries(profile.servers).forEach(
              ([oldServerId, serverConfig]) => {
                // Generate UUID for server if not already mapped
                if (!serverIdMap[oldServerId]) {
                  serverIdMap[oldServerId] = generateUUID();

                  // Add to master list
                  serverMasterList[serverIdMap[oldServerId]] = {
                    ...serverConfig,
                    originalId: oldServerId,
                  };
                }

                // Add reference to profile
                newProfile.servers[serverIdMap[oldServerId]] = {
                  enabled: true,
                  overrides: {},
                };
              },
            );
          }

          profiles.push(newProfile);
        });

        store.set("serverMasterList", serverMasterList);
        store.set("profiles", profiles);
        store.set("storeVersion", "2.0.0");
      }

      return {
        serverMasterList: store.get("serverMasterList"),
        profiles: store.get("profiles"),
      };
    } catch (error) {
      console.error("Import error:", error);
      throw new Error("Failed to import configuration");
    }
  }
  return null;
});

// Add a specific handler for getting a server by original ID
ipcMain.handle("find-server-by-original-id", async (event, originalId) => {
  return findServerByOriginalId(originalId);
});

// Add a specific handler for generating a UUID
ipcMain.handle("generate-uuid", async () => {
  return generateUUID();
});
