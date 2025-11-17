import ProfileServerList from './ProfileServerList';
import ProfileServerOverridesForm from './ProfileServerOverridesForm';
import JsonEditor from './JsonEditor';
import { generateFinalProfileConfig } from '../utils/profileUtils';

const ProfilesView = ({
  // Profile state
  currentProfile,
  activeProfile,
  profiles,

  // Server state
  serverMasterList,
  selectedProfileServer,
  isEditingOverrides,

  // Edit mode
  editMode,
  setEditMode,

  // Handlers
  onToggleServer,
  onEditOverrides,
  onRemoveServer,
  onRestoreDefaults,
  onSaveOverrides,
  onCancelOverrides,
  onShowServerSelectionModal,
  onShowRenameModal,
  onDeleteProfile,
}) => {
  if (!activeProfile) {
    return null;
  }

  return (
    <>
      <div className="tabs">
        <div
          className={`tab ${editMode === 'form' ? 'active' : ''}`}
          onClick={() => setEditMode('form')}
        >
          Form View
        </div>
        <div
          className={`tab ${editMode === 'json' ? 'active' : ''}`}
          onClick={() => setEditMode('json')}
        >
          JSON View
        </div>
      </div>

      {editMode === 'form' ? (
        <>
          {isEditingOverrides ? (
            <ProfileServerOverridesForm
              serverId={selectedProfileServer}
              profileName={activeProfile}
              masterServer={serverMasterList[selectedProfileServer]}
              profileServer={
                currentProfile.servers && currentProfile.servers[selectedProfileServer]
              }
              onSave={onSaveOverrides}
              onCancel={onCancelOverrides}
            />
          ) : (
            <>
              <div className="profile-header">
                <h2>Servers in Profile: {activeProfile}</h2>
                <div
                  className="profile-header-actions"
                  style={{ display: 'flex', gap: '10px' }}
                >
                  <button
                    className="button button-primary"
                    onClick={onShowServerSelectionModal}
                  >
                    Add Server from Master List
                  </button>
                  <button className="button button-secondary" onClick={onShowRenameModal}>
                    Rename Profile
                  </button>
                  {/* Only show delete button if profile has no servers and there's more than one profile */}
                  {profiles.length > 1 &&
                    (!currentProfile.servers ||
                      Object.keys(currentProfile.servers).length === 0) && (
                      <button
                        className="button button-danger"
                        onClick={async () => {
                          const confirmed = await window.api.safeConfirm(
                            `Are you sure you want to delete the profile "${activeProfile}"?`
                          );
                          if (confirmed) {
                            await onDeleteProfile(currentProfile.id);
                          }
                        }}
                      >
                        Delete Profile
                      </button>
                    )}
                </div>
              </div>

              <ProfileServerList
                profile={currentProfile}
                masterServers={serverMasterList}
                selectedServer={selectedProfileServer}
                onSelectServer={(serverId) => {}}
                onToggleServer={onToggleServer}
                onEditOverrides={onEditOverrides}
                onRemoveServer={onRemoveServer}
                onRestoreDefaults={onRestoreDefaults}
              />
            </>
          )}
        </>
      ) : (
        <JsonEditor
          json={JSON.stringify(
            (() => {
              try {
                const cfg = generateFinalProfileConfig(currentProfile, serverMasterList);
                return cfg || { mcpServers: {} };
              } catch (e) {
                console.error('Error generating profile JSON:', e);
                return { mcpServers: {} };
              }
            })(),
            null,
            2
          )}
          readOnly={true}
          isProfileView={true}
          profileName={activeProfile}
        />
      )}
    </>
  );
};

export default ProfilesView;
