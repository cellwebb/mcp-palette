import { useEffect } from 'react';
import ProfileSelector from './components/ProfileSelector';
import ProfilesView from './components/ProfilesView';
import ServerMasterListView from './components/ServerMasterListView';
import ServerSelectionModal from './components/ServerSelectionModal';
import SimpleRenameModal from './components/SimpleRenameModal';
import { convertFinalConfigToInternal } from './utils/profileUtils';
import { useProfiles } from './hooks/useProfiles';
import { useServerMasterList } from './hooks/useServerMasterList';
import { useAppState } from './hooks/useAppState';
import './styles/index.css';
import './styles/validation.css';
import './styles/overrides.css';

const App = () => {
  // Use custom hooks
  const {
    profiles,
    setProfiles,
    activeProfile,
    setActiveProfile,
    currentProfile,
    isAddingProfile,
    setIsAddingProfile,
    showRenameModal,
    setShowRenameModal,
    selectedProfileServer,
    setSelectedProfileServer,
    isEditingOverrides,
    setIsEditingOverrides,
    showServerSelectionModal,
    setShowServerSelectionModal,
    handleProfileSelect,
    handleAddProfile,
    handleRenameProfile,
    handleDeleteProfile,
    handleToggleProfileServer,
    handleAddServerToProfile,
    handleEditOverrides,
    handleRemoveServerFromProfile,
    handleSaveOverrides,
    handleRestoreProfileServerDefaults,
  } = useProfiles();

  const {
    serverMasterList,
    setServerMasterList,
    selectedServerMaster,
    setSelectedServerMaster,
    isAddingServer,
    setIsAddingServer,
    viewingServerJson,
    setViewingServerJson,
    handleAddMasterServer,
    handleSaveMasterServer,
    handleUpdateMasterServer,
    handleDeleteMasterServer,
    handleRestoreServerDefaults,
  } = useServerMasterList();

  const { activePage, setActivePage, editMode, setEditMode } = useAppState();

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
        console.error('Failed to load data:', error);
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

  /**
   * Handle importing config
   */
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

        await window.api.safeAlert('Configuration imported successfully!');
      }
    } catch (error) {
      console.error('Failed to import configuration:', error);
      await window.api.safeAlert(`Import failed: ${error.message}`);
    }
  };

  /**
   * Handle exporting config
   */
  const handleExportConfig = async () => {
    try {
      const success = await window.api.exportConfig();

      if (success) {
        await window.api.safeAlert('Configuration exported successfully!');
      }
    } catch (error) {
      console.error('Failed to export configuration:', error);
      await window.api.safeAlert(`Export failed: ${error.message}`);
    }
  };

  /**
   * Handle JSON edit
   */
  const handleJsonEdit = async (jsonData) => {
    try {
      const parsedData = JSON.parse(jsonData);

      if (activePage === 'profiles') {
        // Convert the final (user-facing) format back to internal format
        const updatedProfile = convertFinalConfigToInternal(
          parsedData,
          currentProfile,
          serverMasterList
        );

        // Update the profile
        const updatedProfiles = await window.api.updateProfile(activeProfile, updatedProfile);
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

      setEditMode('form');
    } catch (error) {
      console.error('Failed to update from JSON:', error);
      await window.api.safeAlert(`Failed to save JSON: ${error.message}`);
    }
  };

  /**
   * Handle delete server with profile refresh
   */
  const handleDeleteMasterServerWithRefresh = async (serverId) => {
    try {
      await handleDeleteMasterServer(serverId);

      // Refresh profiles
      const updatedProfiles = await window.api.getProfiles();
      setProfiles(updatedProfiles);
    } catch (error) {
      // Error already handled in handleDeleteMasterServer
    }
  };

  /**
   * Handle adding server to profile and switching to profiles view
   */
  const handleAddServerToProfileAndSwitch = async (serverId) => {
    await handleAddServerToProfile(serverId);
    setActivePage('profiles');
  };

  return (
    <div className="app-container">
      {/* Modal for server selection */}
      {showServerSelectionModal && (
        <ServerSelectionModal
          show={showServerSelectionModal}
          onClose={() => setShowServerSelectionModal(false)}
          serverMasterList={serverMasterList}
          currentProfileServers={currentProfile.servers || {}}
          onAddServer={handleAddServerToProfileAndSwitch}
        />
      )}

      {/* Rename Profile Modal */}
      <SimpleRenameModal
        isOpen={showRenameModal}
        profileName={activeProfile}
        profiles={profiles}
        onSuccess={(updatedProfiles) => {
          setProfiles(updatedProfiles);
          setShowRenameModal(false);
        }}
        onCancel={() => setShowRenameModal(false)}
        onRenameProfile={handleRenameProfile}
      />

      <header className="header">
        <h1>MCP Palette</h1>
        <h2 className="subtitle">MCP Server Configuration Manager</h2>
      </header>

      <div className="tabs">
        <div
          className={`tab ${activePage === 'profiles' ? 'active' : ''}`}
          onClick={() => setActivePage('profiles')}
        >
          Profiles
        </div>
        <div
          className={`tab ${activePage === 'serverMasterList' ? 'active' : ''}`}
          onClick={() => setActivePage('serverMasterList')}
        >
          Server Master List
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          {activePage === 'profiles' ? (
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
                The Server Master List contains all available MCP servers that can be used in
                profiles.
              </p>
              <p>
                Each server in the master list defines a base configuration that can be customized
                in individual profiles.
              </p>
              <button
                className="button button-primary"
                onClick={handleAddMasterServer}
                style={{ marginTop: '10px' }}
              >
                Add New Server
              </button>
            </div>
          )}
        </div>

        <div className="main-panel">
          {activePage === 'profiles' ? (
            <ProfilesView
              currentProfile={currentProfile}
              activeProfile={activeProfile}
              profiles={profiles}
              serverMasterList={serverMasterList}
              selectedProfileServer={selectedProfileServer}
              isEditingOverrides={isEditingOverrides}
              editMode={editMode}
              setEditMode={setEditMode}
              onToggleServer={handleToggleProfileServer}
              onEditOverrides={handleEditOverrides}
              onRemoveServer={handleRemoveServerFromProfile}
              onRestoreDefaults={(serverId) =>
                handleRestoreProfileServerDefaults(serverId, activeProfile, serverMasterList)
              }
              onSaveOverrides={handleSaveOverrides}
              onCancelOverrides={() => {
                setIsEditingOverrides(false);
                setSelectedProfileServer(null);
              }}
              onShowServerSelectionModal={() => setShowServerSelectionModal(true)}
              onShowRenameModal={() => setShowRenameModal(true)}
              onDeleteProfile={handleDeleteProfile}
            />
          ) : (
            <ServerMasterListView
              serverMasterList={serverMasterList}
              selectedServerMaster={selectedServerMaster}
              isAddingServer={isAddingServer}
              viewingServerJson={viewingServerJson}
              profiles={profiles}
              editMode={editMode}
              setEditMode={setEditMode}
              onSelectServer={setSelectedServerMaster}
              onAddMasterServer={handleAddMasterServer}
              onSaveMasterServer={handleSaveMasterServer}
              onUpdateMasterServer={handleUpdateMasterServer}
              onDeleteMasterServer={handleDeleteMasterServerWithRefresh}
              onViewServerJson={(serverId) => {
                setSelectedServerMaster(serverId);
                setViewingServerJson(true);
              }}
              onCancelServerForm={() => {
                setIsAddingServer(false);
                setSelectedServerMaster(null);
              }}
              onBackFromJson={() => setViewingServerJson(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
