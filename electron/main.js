const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { createAppMenu } = require("./menu");
const path = require("path");
const fs = require("fs");
const { store, setupDefaultProfiles, getMergedServerConfig } = require('./store');


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: "#ffffff",
    show: false,
  });

  // In development mode, load from vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
    createUserMcpServersProfile
  });
  
  Menu.setApplicationMenu(menu);
}

// Function to create a profile with user-specific MCP servers
function createUserMcpServersProfile() {
  const username = process.env.USER || process.env.USERNAME || "user";
  const homePath = app.getPath("home");

  // Create profile with references to master servers but with custom overrides
  const profiles = store.get("profiles");
  const profileName = `${username}'s MCP Servers`;

  const userProfile = {
    name: profileName,
    servers: {
      filesystem: {
        enabled: true,
        overrides: {
          env: {
            BASE_DIRS: `${homePath}/Documents,${homePath}/Downloads,${homePath}/projects`,
          },
        },
      },
      memory: {
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
    // Update existing profile
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
process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

// App lifecycle
app.whenReady().then(() => {
  setupDefaultProfiles();
  setupAppMenu();
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
  serverMasterList[serverData.id] = serverData;
  store.set("serverMasterList", serverMasterList);
  return serverMasterList;
});

ipcMain.handle(
  "update-master-server",
  async (event, { serverId, updatedServer }) => {
    const serverMasterList = store.get("serverMasterList");
    if (serverMasterList[serverId]) {
      serverMasterList[serverId] = updatedServer;
      store.set("serverMasterList", serverMasterList);
    }
    return serverMasterList;
  }
);

ipcMain.handle("delete-master-server", async (event, serverId) => {
  const serverMasterList = store.get("serverMasterList");
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

ipcMain.handle("set-active-profile", async (event, profileName) => {
  store.set("activeProfile", profileName);
  return profileName;
});

ipcMain.handle("add-profile", async (event, profile) => {
  const profiles = store.get("profiles");
  profiles.push(profile);
  store.set("profiles", profiles);
  return profiles;
});

ipcMain.handle(
  "update-profile",
  async (event, { profileName, updatedProfile }) => {
    const profiles = store.get("profiles");
    const index = profiles.findIndex((p) => p.name === profileName);

    if (index !== -1) {
      profiles[index] = updatedProfile;
      store.set("profiles", profiles);
    }

    return profiles;
  }
);

ipcMain.handle("delete-profile", async (event, profileName) => {
  let profiles = store.get("profiles");
  profiles = profiles.filter((p) => p.name !== profileName);
  store.set("profiles", profiles);

  // If the active profile was deleted, switch to the first available
  if (store.get("activeProfile") === profileName && profiles.length > 0) {
    store.set("activeProfile", profiles[0].name);
  }

  return profiles;
});

// Handler for getting merged server configuration
ipcMain.handle(
  "get-effective-server-config",
  async (event, { serverId, profileName }) => {
    const profiles = store.get("profiles");
    const profile = profiles.find((p) => p.name === profileName);

    if (!profile) return null;

    return getMergedServerConfig(serverId, profile.servers[serverId]);
  }
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
        // New format with server master list
        store.set("serverMasterList", importedConfig.serverMasterList);
        store.set("profiles", importedConfig.profiles);
      } else if (Array.isArray(importedConfig)) {
        // Legacy format - just profiles array
        // Convert to new format by extracting servers to master list
        const serverMasterList = {};
        const profiles = [];

        importedConfig.forEach((profile) => {
          const newProfile = {
            name: profile.name,
            servers: {},
          };

          // Extract servers to master list and convert profile to reference them
          if (profile.servers) {
            Object.entries(profile.servers).forEach(
              ([serverId, serverConfig]) => {
                // Add to master list if not already there
                if (!serverMasterList[serverId]) {
                  serverMasterList[serverId] = serverConfig;
                }

                // Add reference to profile
                newProfile.servers[serverId] = {
                  enabled: true,
                  overrides: {},
                };
              }
            );
          }

          profiles.push(newProfile);
        });

        store.set("serverMasterList", serverMasterList);
        store.set("profiles", profiles);
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