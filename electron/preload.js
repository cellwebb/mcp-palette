const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Server Master List management
  getServerMasterList: () => ipcRenderer.invoke("get-server-master-list"),
  addMasterServer: (serverData) =>
    ipcRenderer.invoke("add-master-server", serverData),
  updateMasterServer: (serverId, updatedServer) =>
    ipcRenderer.invoke("update-master-server", { serverId, updatedServer }),
  deleteMasterServer: (serverId) =>
    ipcRenderer.invoke("delete-master-server", serverId),
  getEffectiveServerConfig: (serverId, profileName) =>
    ipcRenderer.invoke("get-effective-server-config", {
      serverId,
      profileName,
    }),

  // Profile management
  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  getActiveProfile: () => ipcRenderer.invoke("get-active-profile"),
  setActiveProfile: (profileName) =>
    ipcRenderer.invoke("set-active-profile", profileName),
  addProfile: (profile) => ipcRenderer.invoke("add-profile", profile),
  updateProfile: (profileName, updatedProfile) =>
    ipcRenderer.invoke("update-profile", { profileName, updatedProfile }),
  deleteProfile: (profileName) =>
    ipcRenderer.invoke("delete-profile", profileName),

  // Import/Export
  exportConfig: () => ipcRenderer.invoke("export-config"),
  importConfig: () => ipcRenderer.invoke("import-config"),

  // Event listeners
  onProfilesUpdated: (callback) => {
    ipcRenderer.on("profiles-updated", () => callback());
    return () => ipcRenderer.removeListener("profiles-updated", callback);
  },
  onProfilesReset: (callback) => {
    ipcRenderer.on("profiles-reset", () => callback());
    return () => ipcRenderer.removeListener("profiles-reset", callback);
  },
  onMenuImportConfig: (callback) => {
    ipcRenderer.on("menu-import-config", () => callback());
    return () => ipcRenderer.removeListener("menu-import-config", callback);
  },
  onMenuExportConfig: (callback) => {
    ipcRenderer.on("menu-export-config", () => callback());
    return () => ipcRenderer.removeListener("menu-export-config", callback);
  },

  // Cleanup listeners to avoid memory leaks
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("profiles-updated");
    ipcRenderer.removeAllListeners("profiles-reset");
    ipcRenderer.removeAllListeners("menu-import-config");
    ipcRenderer.removeAllListeners("menu-export-config");
  },
});
