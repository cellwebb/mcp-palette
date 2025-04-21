import { useState, useEffect } from "react";
import ProfileSelector from "./components/ProfileSelector";
import ServerMasterList from "./components/ServerMasterList";
import ProfileServerList from "./components/ProfileServerList";
import MasterServerForm from "./components/MasterServerForm";
import ProfileServerOverridesForm from "./components/ProfileServerOverridesForm";
import JsonEditor from "./components/JsonEditor";
import ServerSelectionModal from "./components/ServerSelectionModal";
import {
  generateFinalProfileConfig,
  convertFinalConfigToInternal,
  findProfileByIdOrName,
  getServerDisplayName,
} from "./utils/profileUtils";
import { generateUUID, isValidUUID } from "./utils/helpers";
import "./styles/index.css";

const App = () => {
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [serverMasterList, setServerMasterList] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState("");
  const [activePage, setActivePage] = useState("profiles"); // 'profiles' or 'serverMasterList'
  const [selectedServerMaster, setSelectedServerMaster] = useState(null);
  const [selectedProfileServer, setSelectedProfileServer] = useState(null);
  const [editMode, setEditMode] = useState("form"); // 'form' or 'json'
  const [viewingServerJson, setViewingServerJson] = useState(false); // New state for JSON viewer
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isEditingOverrides, setIsEditingOverrides] = useState(false);
  const [showServerSelectionModal, setShowServerSelectionModal] =
    useState(false);

  // Load data on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        const masterList = await window.api.getServerMasterList();
        setServerMasterList(masterList);

        const profilesData = await window.api.getProfiles();
        setProfiles(profilesData);

        const active = await window.api.getActiveProfile();
        setActiveProfile(active);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    // Load data initially
    loadData();

    // Set up event listeners for menu-triggered actions
    if (window.api.onProfilesUpdated) {
      window.api.onProfilesUpdated(loadData);
      window.api.onProfilesReset(loadData);
      window.api.onMenuImportConfig(handleImportConfig);
      window.api.onMenuExportConfig(handleExportConfig);

      // Cleanup on unmount
      return () => window.api.removeAllListeners();
    }
  }, []);

  // Get the current profile object
  const currentProfile = findProfileByIdOrName(profiles, activeProfile) || {};

  // Handle profile selection
  const handleProfileSelect = async (profileId) => {
    try {
      await window.api.setActiveProfile(profileId);
      const profile = findProfileByIdOrName(profiles, profileId);
      setActiveProfile(profile ? profile.name : "");
      setSelectedProfileServer(null);
    } catch (error) {
      console.error("Failed to set active profile:", error);
    }
  };

  // Handle adding a new profile - SIMPLIFIED VERSION
  const handleAddProfile = (profileName) => {
    if (!profileName || !profileName.trim()) {
      alert("Profile name cannot be empty");
      return;
    }

    // Check for duplicate names
    if (
      profiles.some((p) => p.name.toLowerCase() === profileName.toLowerCase())
    ) {
      alert(`A profile with the name "${profileName}" already exists`);
      return;
    }

    // Generate a client-side UUID rather than asking the server
    const uuid = generateUUID();

    // Create new profile object
    const newProfile = {
      id: uuid,
      name: profileName.trim(),
      servers: {},
    };

    // Use a synchronous approach to make debugging easier
    window.api
      .addProfile(newProfile)
      .then((updatedProfiles) => {
        console.log("Profile added successfully:", newProfile);
        setProfiles(updatedProfiles);
        setIsAddingProfile(false);
      })
      .catch((error) => {
        console.error("Failed to add profile:", error);
        alert("Error creating profile: " + (error.message || "Unknown error"));
      });
  };

  // Handle renaming a profile
  const handleRenameProfile = async (params) => {
    // Ensure params have the correct format
    let oldName, newName;

    if (typeof params === "object" && params.oldName && params.newName) {
      oldName = params.oldName;
      newName = params.newName;
    } else if (typeof params === "string" && typeof arguments[1] === "string") {
      // Handle legacy format with separate arguments
      oldName = params;
      newName = arguments[1];
      console.warn(
        "Deprecated: handleRenameProfile now expects an object with oldName and newName properties",
      );
    } else {
      console.error("Invalid parameters for handleRenameProfile:", params);
      throw new Error("Invalid parameters for profile rename");
    }

    console.log("handleRenameProfile called with:", { oldName, newName });

    try {
      // Call the API with the correct parameter structure
      const updatedProfiles = await window.api.renameProfile({
        oldName,
        newName,
      });

      // Update state based on returned profiles
      setProfiles([...updatedProfiles]); // Force a new array reference

      // Update active profile if it was renamed
      if (activeProfile === oldName) {
        setActiveProfile(newName);
      }

      console.log("Rename completed successfully");
      return updatedProfiles;
    } catch (error) {
      console.error("Failed to rename profile:", error);
      throw error; // Re-throw so caller can handle it
    }
  };

  // Handle deleting a profile
  const handleDeleteProfile = async (profileId) => {
    const profile = findProfileByIdOrName(profiles, profileId);
    if (!profile) {
      console.error("Cannot find profile to delete");
      return;
    }

    const profileName = profile.name;
    console.log(`Attempting to delete profile: ${profileName}`);

    // Validate profile name
    if (!profileName) {
      console.error("Cannot delete profile with empty name");
      return;
    }

    // Check if this is the only profile
    if (profiles.length <= 1) {
      await window.api.safeAlert("Cannot delete the last remaining profile");
      return;
    }

    // Confirm deletion with user using safe confirm dialog
    const confirmed = await window.api.safeConfirm(
      `Are you sure you want to delete the profile "${profileName}"?`,
    );
    if (!confirmed) {
      console.log("Profile deletion cancelled by user");
      return;
    }

    console.log("User confirmed deletion, proceeding...");

    try {
      // Call API to delete profile
      console.log("Calling deleteProfile API");
      const updatedProfiles = await window.api.deleteProfile(profileId);
      console.log("API call successful, profiles updated", updatedProfiles);

      // Create new reference to force re-render
      setProfiles([...updatedProfiles]);

      // If the active profile was deleted, fetch the new active profile
      if (activeProfile === profileName) {
        console.log("Active profile was deleted, getting new active profile");
        const newActiveProfile = await window.api.getActiveProfile();
        console.log(`New active profile: ${newActiveProfile}`);
        setActiveProfile(newActiveProfile);
      }

      // Reset any selected server
      setSelectedProfileServer(null);

      console.log("Profile deletion completed successfully");
    } catch (error) {
      console.error("Failed to delete profile:", error);
      await window.api.safeAlert(error.message || "Failed to delete profile");
    }
  };

  // Handle adding a server to master list
  const handleAddMasterServer = () => {
    setSelectedServerMaster(null);
    setIsAddingServer(true);
  };

  // Handle saving a server to master list
  const handleSaveMasterServer = async (serverData) => {
    try {
      // UUID is now always generated on the backend
      // We don't need to extract or handle the ID manually

      const updatedMasterList = await window.api.addMasterServer(serverData);

      setServerMasterList(updatedMasterList);
      setIsAddingServer(false);
      setSelectedServerMaster(null);

      // Show success message
      await window.api.safeAlert(
        `Server "${serverData.name}" added to Master List successfully!`,
      );
    } catch (error) {
      console.error("Failed to save server:", error);
      await window.api.safeAlert("Failed to save server: " + error.message);
    }
  };

  // Handle updating a server in master list
  const handleUpdateMasterServer = async (serverId, updatedServer) => {
    try {
      const updatedMasterList = await window.api.updateMasterServer(
        serverId,
        updatedServer,
      );
      setServerMasterList(updatedMasterList);
    } catch (error) {
      console.error("Failed to update server:", error);
      await window.api.safeAlert("Failed to update server: " + error.message);
    }
  };

  // Handle deleting a server from master list
  const handleDeleteMasterServer = async (serverId) => {
    const confirmed = await window.api.safeConfirm(
      `Are you sure you want to delete the server "${serverId}" from the Master List? This will also remove it from all profiles.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const updatedMasterList = await window.api.deleteMasterServer(serverId);
      setServerMasterList(updatedMasterList);
      setSelectedServerMaster(null);

      // Refresh profiles
      const updatedProfiles = await window.api.getProfiles();
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error("Failed to delete server:", error);
      await window.api.safeAlert("Failed to delete server: " + error.message);
    }
  };

  // Handle restoring server defaults
  const handleRestoreServerDefaults = async (serverId) => {
    try {
      const serverConfig = serverMasterList[serverId];

      // If no server config is found, show error
      if (!serverConfig) {
        await window.api.safeAlert(`Server with ID ${serverId} not found.`);
        return;
      }

      // Get the original ID or name to determine server type
      const serverType =
        serverConfig.originalId || serverConfig.name || serverId;

      // Default configurations based on server type
      const defaultConfigs = {
        filesystem: {
          name: "filesystem",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
          env: { BASE_DIRS: "~/Documents,~/Downloads" },
          originalId: "filesystem",
        },
        memory: {
          name: "memory",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
          env: { MEMORY_FILE_PATH: "~/.mcp-memory.json" },
          originalId: "memory",
        },
        puppeteer: {
          name: "puppeteer",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
          env: {
            HEADLESS: "true",
            USER_AGENT: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
          originalId: "puppeteer",
        },
        // Add more server types as needed
      };

      // Try to determine server type from original ID or name
      const serverTypeKey = Object.keys(defaultConfigs).find(
        (key) => key === serverType || key === serverType.split("-")[0],
      );

      // Get default configuration for this server type or use fallback
      const defaultConfig = serverTypeKey
        ? defaultConfigs[serverTypeKey]
        : {
            name: serverConfig.name || "unnamed-server",
            command: "npx",
            args: ["-y", `@modelcontextprotocol/server-${serverType}`],
            env: {},
            originalId: serverConfig.originalId || serverType,
          };

      // Update the server with default configuration
      const updatedMasterList = await window.api.updateMasterServer(
        serverId,
        defaultConfig,
      );
      setServerMasterList(updatedMasterList);

      await window.api.safeAlert(
        `Server "${getServerDisplayName(serverConfig)}" restored to default configuration.`,
      );
    } catch (error) {
      console.error("Failed to restore server defaults:", error);
      await window.api.safeAlert(
        `Failed to restore defaults: ${error.message}`,
      );
    }
  };

  // Handle toggling a server in a profile
  const handleToggleProfileServer = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Make sure server entry exists
      if (!updatedProfile.servers[serverId]) {
        updatedProfile.servers[serverId] = {
          enabled: false,
          overrides: {},
        };
      }

      // Toggle enabled state
      updatedProfile.servers[serverId].enabled =
        !updatedProfile.servers[serverId].enabled;

      // Update profile
      const updatedProfiles = await window.api.updateProfile(
        activeProfile,
        updatedProfile,
      );
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error("Failed to toggle server:", error);
      await window.api.safeAlert("Failed to toggle server: " + error.message);
    }
  };

  // Handle adding server to profile (when importing from master list)
  const handleAddServerToProfile = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Add server if not already in profile
      if (!updatedProfile.servers[serverId]) {
        updatedProfile.servers[serverId] = {
          enabled: true,
          overrides: {},
        };
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(
        activeProfile,
        updatedProfile,
      );
      setProfiles(updatedProfiles);

      // Switch to profiles view
      setActivePage("profiles");
    } catch (error) {
      console.error("Failed to add server to profile:", error);
      await window.api.safeAlert(
        "Failed to add server to profile: " + error.message,
      );
    }
  };

  // Handle editing profile server overrides
  const handleEditOverrides = (serverId) => {
    setSelectedProfileServer(serverId);
    setIsEditingOverrides(true);
  };

  // Handle removing a server from profile
  const handleRemoveServerFromProfile = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) return;

      // Remove server from profile
      if (updatedProfile.servers[serverId]) {
        delete updatedProfile.servers[serverId];
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(
        activeProfile,
        updatedProfile,
      );
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error("Failed to remove server from profile:", error);
      await window.api.safeAlert(
        "Failed to remove server from profile: " + error.message,
      );
    }
  };

  // Handle saving server overrides
  const handleSaveOverrides = async (updatedServer) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Update server in profile
      updatedProfile.servers[selectedProfileServer] = updatedServer;

      // Update profile
      const updatedProfiles = await window.api.updateProfile(
        activeProfile,
        updatedProfile,
      );
      setProfiles(updatedProfiles);

      // Exit editing mode
      setIsEditingOverrides(false);
      setSelectedProfileServer(null);
    } catch (error) {
      console.error("Failed to save overrides:", error);
      await window.api.safeAlert("Failed to save overrides: " + error.message);
    }
  };

  // Handle restoring profile server defaults (removes all overrides)
  const handleRestoreProfileServerDefaults = async (serverId, profileName) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, profileName);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Reset server to default (remove all overrides) but keep enabled state
      if (updatedProfile.servers && updatedProfile.servers[serverId]) {
        const isEnabled = updatedProfile.servers[serverId].enabled;
        updatedProfile.servers[serverId] = {
          enabled: isEnabled,
          overrides: {}, // Empty overrides
        };
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(
        profileName,
        updatedProfile,
      );
      setProfiles(updatedProfiles);

      // Show confirmation
      const serverName = serverMasterList[serverId]
        ? getServerDisplayName(serverMasterList[serverId])
        : serverId;

      await window.api.safeAlert(
        `Server "${serverName}" in profile "${profileName}" restored to defaults.`,
      );
    } catch (error) {
      console.error("Failed to restore server defaults:", error);
      await window.api.safeAlert(
        `Failed to restore defaults: ${error.message}`,
      );
    }
  };

  // Handle importing config
  const handleImportConfig = async () => {
    try {
      const result = await window.api.importConfig();

      if (result) {
        if (result.serverMasterList) {
          setServerMasterList(result.serverMasterList);
        }

        if (result.profiles) {
          setProfiles(result.profiles);
        }

        await window.api.safeAlert("Configuration imported successfully!");
      }
    } catch (error) {
      console.error("Failed to import configuration:", error);
      await window.api.safeAlert(`Import failed: ${error.message}`);
    }
  };

  // Handle exporting config
  const handleExportConfig = async () => {
    try {
      const success = await window.api.exportConfig();

      if (success) {
        await window.api.safeAlert("Configuration exported successfully!");
      }
    } catch (error) {
      console.error("Failed to export configuration:", error);
      await window.api.safeAlert(`Export failed: ${error.message}`);
    }
  };

  // Handle JSON edit
  const handleJsonEdit = async (jsonData) => {
    try {
      const parsedData = JSON.parse(jsonData);

      if (activePage === "profiles") {
        // Convert the final (user-facing) format back to internal format
        const updatedProfile = convertFinalConfigToInternal(
          parsedData,
          currentProfile,
          serverMasterList,
        );

        // Update the profile
        const updatedProfiles = await window.api.updateProfile(
          activeProfile,
          updatedProfile,
        );
        setProfiles(updatedProfiles);
      } else {
        // Update each server in the master list
        const masterList = parsedData;
        for (const [serverId, serverData] of Object.entries(masterList)) {
          await window.api.updateMasterServer(serverId, serverData);
        }

        // Refresh master list
        const updatedMasterList = await window.api.getServerMasterList();
        setServerMasterList(updatedMasterList);
      }

      setEditMode("form");
    } catch (error) {
      console.error("Failed to update from JSON:", error);
      await window.api.safeAlert(`Failed to save JSON: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Modal for server selection */}
      {showServerSelectionModal && (
        <ServerSelectionModal
          show={showServerSelectionModal}
          onClose={() => setShowServerSelectionModal(false)}
          serverMasterList={serverMasterList}
          onAddServer={handleAddServerToProfile}
        />
      )}
      <header className="header">
        <h1>MCP Palette</h1>
        <h2 className="subtitle">MCP Server Configuration Manager</h2>
      </header>

      <div className="tabs">
        <div
          className={`tab ${activePage === "profiles" ? "active" : ""}`}
          onClick={() => setActivePage("profiles")}
        >
          Profiles
        </div>
        <div
          className={`tab ${activePage === "serverMasterList" ? "active" : ""}`}
          onClick={() => setActivePage("serverMasterList")}
        >
          Server Master List
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          {activePage === "profiles" ? (
            <ProfileSelector
              profiles={profiles}
              activeProfile={activeProfile}
              onProfileSelect={handleProfileSelect}
              onAddProfile={handleAddProfile}
              onRenameProfile={handleRenameProfile}
              onDeleteProfile={handleDeleteProfile}
              isAddingProfile={isAddingProfile}
              setIsAddingProfile={setIsAddingProfile}
            />
          ) : (
            <div className="server-master-info">
              <h2>Server Master List</h2>
              <p>
                The Server Master List contains all available MCP servers that
                can be used in profiles.
              </p>
              <p>
                Each server in the master list defines a base configuration that
                can be customized in individual profiles.
              </p>
              <button
                className="button button-primary"
                onClick={handleAddMasterServer}
                style={{ marginTop: "10px" }}
              >
                Add New Server
              </button>
            </div>
          )}
        </div>

        <div className="main-panel">
          {activePage === "profiles" ? (
            // Profiles View
            <>
              {activeProfile && (
                <>
                  <div className="tabs">
                    <div
                      className={`tab ${editMode === "form" ? "active" : ""}`}
                      onClick={() => setEditMode("form")}
                    >
                      Form View
                    </div>
                    <div
                      className={`tab ${editMode === "json" ? "active" : ""}`}
                      onClick={() => setEditMode("json")}
                    >
                      JSON View
                    </div>
                  </div>

                  {editMode === "form" ? (
                    <>
                      {isEditingOverrides ? (
                        <ProfileServerOverridesForm
                          serverId={selectedProfileServer}
                          profileName={activeProfile}
                          masterServer={serverMasterList[selectedProfileServer]}
                          profileServer={
                            currentProfile.servers &&
                            currentProfile.servers[selectedProfileServer]
                          }
                          onSave={handleSaveOverrides}
                          onCancel={() => {
                            setIsEditingOverrides(false);
                            setSelectedProfileServer(null);
                          }}
                        />
                      ) : (
                        <>
                          <div className="profile-header">
                            <h2>Profile: {activeProfile}</h2>
                            <button
                              className="button button-primary"
                              onClick={() => setShowServerSelectionModal(true)}
                            >
                              Add Server from Master List
                            </button>
                          </div>

                          <ProfileServerList
                            profile={currentProfile}
                            masterServers={serverMasterList}
                            selectedServer={selectedProfileServer}
                            onSelectServer={setSelectedProfileServer}
                            onToggleServer={handleToggleProfileServer}
                            onEditOverrides={handleEditOverrides}
                            onRemoveServer={handleRemoveServerFromProfile}
                            onRestoreDefaults={
                              handleRestoreProfileServerDefaults
                            }
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <JsonEditor
                      json={JSON.stringify(
                        generateFinalProfileConfig(
                          currentProfile,
                          serverMasterList,
                        ),
                        null,
                        2,
                      )}
                      readOnly={true}
                      isProfileView={true}
                      onViewServerJson={(serverId) => {
                        setSelectedServerMaster(serverId);
                        setViewingServerJson(true);
                      }}
                      onRestoreDefaults={handleRestoreServerDefaults}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            // Server Master List View
            <>
              <div className="tabs">
                <div
                  className={`tab ${editMode === "form" ? "active" : ""}`}
                  onClick={() => setEditMode("form")}
                >
                  Form View
                </div>
                <div
                  className={`tab ${editMode === "json" ? "active" : ""}`}
                  onClick={() => setEditMode("json")}
                >
                  JSON View
                </div>
              </div>

              {editMode === "form" ? (
                <>
                  {viewingServerJson && selectedServerMaster ? (
                    // View individual server JSON
                    <div className="server-json-viewer">
                      <div className="server-json-header">
                        <h2>
                          Server JSON:{" "}
                          {getServerDisplayName(
                            serverMasterList[selectedServerMaster],
                          )}
                        </h2>
                        <button
                          className="button button-secondary"
                          onClick={() => setViewingServerJson(false)}
                        >
                          Back to Form
                        </button>
                      </div>

                      <JsonEditor
                        json={JSON.stringify(
                          {
                            // Exclude the internal id field
                            ...serverMasterList[selectedServerMaster],
                          },
                          null,
                          2,
                        )}
                        readOnly={true}
                        isProfileView={false}
                      />
                    </div>
                  ) : isAddingServer || selectedServerMaster ? (
                    <MasterServerForm
                      server={
                        selectedServerMaster
                          ? serverMasterList[selectedServerMaster]
                          : null
                      }
                      serverId={selectedServerMaster}
                      onSave={handleSaveMasterServer}
                      onCancel={() => {
                        setIsAddingServer(false);
                        setSelectedServerMaster(null);
                      }}
                      onViewJson={() => setViewingServerJson(true)}
                    />
                  ) : (
                    <ServerMasterList
                      servers={serverMasterList}
                      selectedServer={selectedServerMaster}
                      onSelectServer={setSelectedServerMaster}
                      onAddServer={handleAddMasterServer}
                      onDeleteServer={handleDeleteMasterServer}
                      onViewServerJson={(serverId) => {
                        setSelectedServerMaster(serverId);
                        setViewingServerJson(true);
                      }}
                    />
                  )}
                </>
              ) : (
                <JsonEditor
                  json={JSON.stringify(serverMasterList, null, 2)}
                  readOnly={true}
                  isProfileView={false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
