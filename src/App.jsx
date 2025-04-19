const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);
const [confirmMessage, setConfirmMessage] = useState("");
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
} from "./utils/profileUtils";
import "./styles/index.css";

const App = () => {
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
  const currentProfile = profiles.find((p) => p.name === activeProfile) || {};

  // Handle profile selection
  const handleProfileSelect = async (profileName) => {
    try {
      await window.api.setActiveProfile(profileName);
      setActiveProfile(profileName);
      setSelectedProfileServer(null);
    } catch (error) {
      console.error("Failed to set active profile:", error);
    }
  };

  // Handle adding a new profile
  const handleAddProfile = async (profileName) => {
    if (!profileName.trim()) return;

    try {
      const newProfile = {
        name: profileName,
        servers: {},
      };

      const updatedProfiles = await window.api.addProfile(newProfile);
      setProfiles(updatedProfiles);
      setIsAddingProfile(false);
    } catch (error) {
      console.error("Failed to add profile:", error);
    }
  };

  // Handle renaming a profile
  const handleRenameProfile = async (oldName, newName) => {
    console.log("handleRenameProfile called with:", oldName, newName);

    // Validate inputs
    if (!oldName) {
      console.error("Cannot rename with empty old name");
      await window.api.safeAlert("Cannot rename with empty old name");
      return;
    }

    // Ensure newName is trimmed
    newName = newName.trim();

    if (!newName) {
      console.error("Cannot rename to empty name");
      await window.api.safeAlert("Profile name cannot be empty");
      return;
    }

    // Early return for no change (with success message)
    if (newName === oldName) {
      console.log("No change in name, considering this successful");
      return; // No change, but not an error
    }

    console.log("Proceeding with rename from", oldName, "to", newName);

    try {
      // Check if the new name already exists (case insensitive)
      if (
        profiles.some((p) => p.name.toLowerCase() === newName.toLowerCase())
      ) {
        console.error("Profile name already exists");
        await window.api.safeAlert(
          `A profile with the name "${newName}" already exists`,
        );
        return;
      }

      // Call the API
      console.log("Calling renameProfile API");
      const updatedProfiles = await window.api.renameProfile(oldName, newName);
      console.log("API call successful, updated profiles:", updatedProfiles);

      // Ensure proper state updates by using the returned profiles
      setProfiles([...updatedProfiles]); // Force a new array reference

      // Update active profile if it was renamed
      if (activeProfile === oldName) {
        console.log(
          "Updating active profile from",
          activeProfile,
          "to",
          newName,
        );
        setActiveProfile(newName);
      }

      console.log("Rename completed successfully");
    } catch (error) {
      console.error("Failed to rename profile:", error);
      await window.api.safeAlert(error.message || "Failed to rename profile");
      throw error; // Re-throw to notify the ProfileSelector component
    }
  };

  // Handle deleting a profile
  const handleDeleteProfile = async (profileName) => {
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
      const updatedProfiles = await window.api.deleteProfile(profileName);
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
      const serverId = serverData.id;
      delete serverData.id; // Remove id from the object, it's the key in the map

      const updatedMasterList = await window.api.addMasterServer({
        id: serverId,
        ...serverData,
      });

      setServerMasterList(updatedMasterList);
      setIsAddingServer(false);
      setSelectedServerMaster(null);

      // If this is a new server, show a success message
      if (!serverMasterList[serverId]) {
        alert(`Server "${serverData.name}" added to Master List successfully!`);
      }
    } catch (error) {
      console.error("Failed to save server:", error);
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
    }
  };

  // Handle deleting a server from master list
  const handleDeleteMasterServer = async (serverId) => {
    if (
      !confirm(
        `Are you sure you want to delete the server "${serverId}" from the Master List? This will also remove it from all profiles.`,
      )
    ) {
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
    }
  };

  // Handle restoring server defaults
  const handleRestoreServerDefaults = async (serverId) => {
    try {
      // Since we don't have a direct API for server defaults, we'll create a
      // simplified version based on server ID
      const serverType = serverId.split("-")[0] || serverId; // Extract server type from ID

      // Default configurations based on server type
      const defaultConfigs = {
        filesystem: {
          name: "filesystem",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
          env: { BASE_DIRS: "~/Documents,~/Downloads" },
        },
        memory: {
          name: "memory",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
          env: { MEMORY_FILE_PATH: "~/.mcp-memory.json" },
        },
        puppeteer: {
          name: "puppeteer",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-puppeteer"],
          env: {
            HEADLESS: "true",
            USER_AGENT: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
        },
        // Add more server types as needed
      };

      // Get default configuration for this server type
      const defaultConfig = defaultConfigs[serverType] || {
        name: serverMasterList[serverId].name,
        command: "npx",
        args: ["-y", `@modelcontextprotocol/server-${serverType}`],
        env: {},
      };

      // Update the server with default configuration
      const updatedMasterList = await window.api.updateMasterServer(
        serverId,
        defaultConfig,
      );
      setServerMasterList(updatedMasterList);

      alert(`Server "${serverId}" restored to default configuration.`);
    } catch (error) {
      console.error("Failed to restore server defaults:", error);
      alert(`Failed to restore defaults: ${error.message}`);
    }
  };

  // Handle toggling a server in a profile
  const handleToggleProfileServer = async (serverId) => {
    try {
      // Get current profile
      const profile = profiles.find((p) => p.name === activeProfile);
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
    }
  };

  // Handle adding server to profile (when importing from master list)
  const handleAddServerToProfile = async (serverId) => {
    try {
      // Get current profile
      const profile = profiles.find((p) => p.name === activeProfile);
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
      const profile = profiles.find((p) => p.name === activeProfile);
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
    }
  };

  // Handle saving server overrides
  const handleSaveOverrides = async (updatedServer) => {
    try {
      // Get current profile
      const profile = profiles.find((p) => p.name === activeProfile);
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
    }
  };

  // Handle restoring profile server defaults (removes all overrides)
  const handleRestoreProfileServerDefaults = async (serverId, profileName) => {
    try {
      // Get current profile
      const profile = profiles.find((p) => p.name === profileName);
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

      alert(
        `Server "${serverId}" in profile "${profileName}" restored to defaults.`,
      );
    } catch (error) {
      console.error("Failed to restore server defaults:", error);
      alert(`Failed to restore defaults: ${error.message}`);
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

        alert("Configuration imported successfully!");
      }
    } catch (error) {
      console.error("Failed to import configuration:", error);
      alert(`Import failed: ${error.message}`);
    }
  };

  // Handle exporting config
  const handleExportConfig = async () => {
    try {
      const success = await window.api.exportConfig();

      if (success) {
        alert("Configuration exported successfully!");
      }
    } catch (error) {
      console.error("Failed to export configuration:", error);
      alert(`Export failed: ${error.message}`);
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
      alert(`Failed to save JSON: ${error.message}`);
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
                          {serverMasterList[selectedServerMaster].name}
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
