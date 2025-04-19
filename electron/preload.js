const { contextBridge, ipcRenderer } = require("electron");

// Enhanced safer versions of alert/confirm that don't use window.prompt
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

      // Create header for better visibility
      const header = document.createElement("div");
      header.className = "modal-header";
      header.style.marginBottom = "15px";

      const title = document.createElement("h3");
      title.textContent = "Notice";
      title.style.margin = "0";
      title.style.color = "#333";

      header.appendChild(title);
      content.appendChild(header);

      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      messageEl.style.margin = "0 0 15px 0";

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

      // Also close on Escape key
      const keyHandler = (e) => {
        if (e.key === "Escape") {
          document.body.removeChild(dialog);
          document.removeEventListener("keydown", keyHandler);
          resolve(true);
        }
      };
      document.addEventListener("keydown", keyHandler);

      button.onclick = () => {
        document.body.removeChild(dialog);
        document.removeEventListener("keydown", keyHandler);
        resolve(true);
      };

      content.appendChild(messageEl);
      content.appendChild(button);
      dialog.appendChild(content);
      document.body.appendChild(dialog);

      // Auto-focus the button
      setTimeout(() => button.focus(), 50);
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
      content.style.minWidth = "350px";
      content.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

      // Create header for better visibility
      const header = document.createElement("div");
      header.className = "modal-header";
      header.style.marginBottom = "15px";

      const title = document.createElement("h3");
      title.textContent = "Confirmation";
      title.style.margin = "0";
      title.style.color = "#333";

      header.appendChild(title);
      content.appendChild(header);

      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      messageEl.style.margin = "0 0 20px 0";

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
      confirmButton.style.backgroundColor = "#dc3545"; // Red for confirmation actions
      confirmButton.style.color = "white";
      confirmButton.style.border = "none";
      confirmButton.style.borderRadius = "4px";
      confirmButton.style.cursor = "pointer";

      // Handle keyboard events
      const keyHandler = (e) => {
        if (e.key === "Escape") {
          document.body.removeChild(dialog);
          document.removeEventListener("keydown", keyHandler);
          resolve(false);
        } else if (e.key === "Enter") {
          document.body.removeChild(dialog);
          document.removeEventListener("keydown", keyHandler);
          resolve(true);
        }
      };
      document.addEventListener("keydown", keyHandler);

      cancelButton.onclick = () => {
        document.body.removeChild(dialog);
        document.removeEventListener("keydown", keyHandler);
        resolve(false);
      };

      confirmButton.onclick = () => {
        document.body.removeChild(dialog);
        document.removeEventListener("keydown", keyHandler);
        resolve(true);
      };

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      content.appendChild(messageEl);
      content.appendChild(buttonContainer);
      dialog.appendChild(content);
      document.body.appendChild(dialog);

      // Auto-focus the cancel button (safer default)
      setTimeout(() => cancelButton.focus(), 50);
    });
  },
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // UUID utilities
  generateUUID: () => ipcRenderer.invoke("generate-uuid"),
  findServerByOriginalId: (originalId) =>
    ipcRenderer.invoke("find-server-by-original-id", originalId),

  // Server Master List management
  getServerMasterList: () => ipcRenderer.invoke("get-server-master-list"),
  addMasterServer: (serverData) =>
    ipcRenderer.invoke("add-master-server", serverData),
  updateMasterServer: (serverId, updatedServer) =>
    ipcRenderer.invoke("update-master-server", { serverId, updatedServer }),
  deleteMasterServer: (serverId) =>
    ipcRenderer.invoke("delete-master-server", serverId),
  getEffectiveServerConfig: (serverId, profileId) =>
    ipcRenderer.invoke("get-effective-server-config", {
      serverId,
      profileId,
    }),

  // Profile management
  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  getActiveProfile: () => ipcRenderer.invoke("get-active-profile"),
  setActiveProfile: (profileId) =>
    ipcRenderer.invoke("set-active-profile", profileId),
  addProfile: (profile) => ipcRenderer.invoke("add-profile", profile),
  updateProfile: (profileName, updatedProfile) =>
    ipcRenderer.invoke("update-profile", { profileName, updatedProfile }),
  renameProfile: async (params) => {
    // Ensure params is an object with oldName and newName properties
    if (typeof params !== "object" || !params.oldName || !params.newName) {
      console.error("Invalid parameters for renameProfile:", params);
      throw new Error("Invalid parameters: expected {oldName, newName}");
    }
    return await ipcRenderer.invoke("rename-profile", params);
  },
  deleteProfile: (profileId) => ipcRenderer.invoke("delete-profile", profileId),

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
