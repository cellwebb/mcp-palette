import { useState, useEffect } from "react";
import ProfileSelector from "./components/ProfileSelector";
import ServerMasterList from "./components/ServerMasterList";
import ProfileServerList from "./components/ProfileServerList";
import MasterServerForm from "./components/MasterServerForm";
import ProfileServerOverridesForm from "./components/ProfileServerOverridesForm";
import JsonEditor from "./components/JsonEditor";
import ServerSelectionModal from "./components/ServerSelectionModal";
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

  // Handle deleting a profile
  const handleDeleteProfile = async (profileName) => {
    if (
      !confirm(`Are you sure you want to delete the profile "${profileName}"?`)
    ) {
      return;
    }

    try {
      const updatedProfiles = await window.api.deleteProfile(profileName);
      setProfiles(updatedProfiles);

      // Update active profile if it was deleted
      const newActiveProfile = await window.api.getActiveProfile();
      setActiveProfile(newActiveProfile);
      setSelectedProfileServer(null);
    } catch (error) {
      console.error("Failed to delete profile:", error);
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
        // Update the current profile
        const updatedProfiles = await window.api.updateProfile(
          activeProfile,
          parsedData,
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
        <h1>MCP Server Manager</h1>
        <div className="header-actions">
          <button
            className="button button-secondary"
            onClick={handleExportConfig}
          >
            Export
          </button>
        </div>
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
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <JsonEditor
                      json={JSON.stringify(currentProfile, null, 2)}
                      onSave={handleJsonEdit}
                      onViewServerJson={(serverId) => {
                        setSelectedServerMaster(serverId);
                        setViewingServerJson(true);
                      }}
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
                            id: selectedServerMaster,
                            ...serverMasterList[selectedServerMaster],
                          },
                          null,
                          2,
                        )}
                        readOnly={true}
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
                  onSave={handleJsonEdit}
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
