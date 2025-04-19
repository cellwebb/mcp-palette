const { contextBridge, ipcRenderer } = require("electron");

// Create safer versions of alert/confirm that don't use window.prompt
const safeDialogs = {
  alert: (message) => {
    return new Promise((resolve) => {
      // Create a custom dialog
      const dialog = document.createElement("div");
      dialog.className = "modal-overlay";
      dialog.style.position = "fixed";
      dialog.style.top = "0";
      dialog.style.left = "0";
      dialog.style.right = "0";
      dialog.style.bottom = "0";
      dialog.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      dialog.style.display = "flex";
      dialog.style.justifyContent = "center";
      dialog.style.alignItems = "center";
      dialog.style.zIndex = "9999";

      const content = document.createElement("div");
      content.className = "modal-content";
      content.style.backgroundColor = "white";
      content.style.padding = "20px";
      content.style.borderRadius = "4px";
      content.style.minWidth = "300px";
      content.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

      const messageEl = document.createElement("p");
      messageEl.textContent = message;

      const button = document.createElement("button");
      button.textContent = "OK";
      button.className = "button button-primary";
      button.style.padding = "8px 16px";
      button.style.marginTop = "10px";
      button.style.backgroundColor = "#007bff";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.cursor = "pointer";
      button.style.float = "right";

      button.onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };

      content.appendChild(messageEl);
      content.appendChild(button);
      dialog.appendChild(content);
      document.body.appendChild(dialog);
    });
  },

  confirm: (message) => {
    return new Promise((resolve) => {
      // Create a custom dialog
      const dialog = document.createElement("div");
      dialog.className = "modal-overlay";
      dialog.style.position = "fixed";
      dialog.style.top = "0";
      dialog.style.left = "0";
      dialog.style.right = "0";
      dialog.style.bottom = "0";
      dialog.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      dialog.style.display = "flex";
      dialog.style.justifyContent = "center";
      dialog.style.alignItems = "center";
      dialog.style.zIndex = "9999";

      const content = document.createElement("div");
      content.className = "modal-content";
      content.style.backgroundColor = "white";
      content.style.padding = "20px";
      content.style.borderRadius = "4px";
      content.style.minWidth = "300px";
      content.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

      const messageEl = document.createElement("p");
      messageEl.textContent = message;

      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.justifyContent = "flex-end";
      buttonContainer.style.gap = "10px";
      buttonContainer.style.marginTop = "15px";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.className = "button button-secondary";
      cancelButton.style.padding = "8px 16px";
      cancelButton.style.backgroundColor = "#6c757d";
      cancelButton.style.color = "white";
      cancelButton.style.border = "none";
      cancelButton.style.borderRadius = "4px";
      cancelButton.style.cursor = "pointer";

      const confirmButton = document.createElement("button");
      confirmButton.textContent = "Confirm";
      confirmButton.className = "button button-primary";
      confirmButton.style.padding = "8px 16px";
      confirmButton.style.backgroundColor = "#007bff";
      confirmButton.style.color = "white";
      confirmButton.style.border = "none";
      confirmButton.style.borderRadius = "4px";
      confirmButton.style.cursor = "pointer";

      cancelButton.onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };

      confirmButton.onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      content.appendChild(messageEl);
      content.appendChild(buttonContainer);
      dialog.appendChild(content);
      document.body.appendChild(dialog);
    });
  },
};

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
  renameProfile: (oldName, newName) =>
    ipcRenderer.invoke("rename-profile", { oldName, newName }),
  deleteProfile: (profileName) =>
    ipcRenderer.invoke("delete-profile", profileName),

  // Import/Export
  exportConfig: () => ipcRenderer.invoke("export-config"),
  importConfig: () => ipcRenderer.invoke("import-config"),

  // Custom safe dialog implementations
  safeAlert: safeDialogs.alert,
  safeConfirm: safeDialogs.confirm,

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
