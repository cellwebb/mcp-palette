import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import DropdownMenu from "./DropdownMenu";
import SimpleRenameModal from "./SimpleRenameModal";
import ConfirmButton from "./ConfirmButton";

const ProfileSelector = ({
  profiles,
  activeProfile,
  onProfileSelect,
  onAddProfile,
  onRenameProfile,
  onDeleteProfile,
  isAddingProfile,
  setIsAddingProfile,
}) => {
  const [newProfileName, setNewProfileName] = useState("");
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [profileToRename, setProfileToRename] = useState(null);

  // Direct function to create a profile
  const createProfile = () => {
    if (!newProfileName.trim()) {
      alert("Profile name cannot be empty");
      return;
    }

    // Check for duplicate names
    if (
      profiles.some(
        (p) => p.name.toLowerCase() === newProfileName.trim().toLowerCase(),
      )
    ) {
      alert(
        `A profile with the name "${newProfileName.trim()}" already exists`,
      );
      return;
    }

    console.log("Creating profile:", newProfileName);

    // Call the parent component's handler directly
    onAddProfile(newProfileName.trim());

    // Clear the input field
    setNewProfileName("");
  };

  // Start renaming a profile using modal
  const startRenaming = (profileName) => {
    // Only allow one operation at a time
    if (operationInProgress) return;

    setProfileToRename(profileName);
    setShowRenameModal(true);
  };

  // Handle rename success from modal
  const handleRenameSuccess = async (updatedProfiles) => {
    // Modal handles the rename operation directly
    console.log("Profile renamed successfully");

    // Close the modal
    setShowRenameModal(false);
    setProfileToRename(null);
    setOperationInProgress(false);

    // If the parent's onRenameProfile was successfully called by the modal
    // then we don't need to do anything else here
  };

  // Cancel renaming
  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setProfileToRename(null);
    setOperationInProgress(false);
  };

  // Initiate profile deletion
  const initiateDeleteProfile = async (profileId) => {
    if (profiles.length <= 1) {
      alert("Cannot delete the last remaining profile");
      return;
    }

    setProfileToDelete(profileId);
    setShowDeleteConfirmation(true);
  };

  // Confirm and execute profile deletion
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    setOperationInProgress(true);
    try {
      await onDeleteProfile(profileToDelete);
      setShowDeleteConfirmation(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert(`Failed to delete profile: ${error.message || "Unknown error"}`);
    } finally {
      setOperationInProgress(false);
    }
  };

  // Helper function to export a profile as JSON file
  const exportProfile = (profile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `${profile.name}-profile.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Helper function to copy profile data to clipboard
  const copyToClipboard = async (profile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    try {
      await navigator.clipboard.writeText(dataStr);
      alert(`Profile '${profile.name}' copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy profile to clipboard: ", err);
      alert("Failed to copy to clipboard");
    }
  };

  return (
    <div className="profile-selector">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete Profile"
          message={`Are you sure you want to delete this profile? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteProfile}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setProfileToDelete(null);
          }}
        />
      )}

      {/* Rename Modal */}
      <SimpleRenameModal
        isOpen={showRenameModal}
        profileName={profileToRename}
        profiles={profiles}
        onSuccess={handleRenameSuccess}
        onCancel={handleRenameCancel}
        onRenameProfile={onRenameProfile}
      />

      <div className="profile-selector-header">
        <h2>Profiles</h2>
        <button
          className="button button-primary"
          onClick={() => setIsAddingProfile(true)}
          disabled={operationInProgress}
        >
          Add Profile
        </button>
      </div>

      {isAddingProfile && (
        <div className="profile-form">
          <div>
            <input
              type="text"
              placeholder="Profile Name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createProfile();
                }
              }}
            />
            <div className="profile-form-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={createProfile}
                disabled={!newProfileName.trim()}
              >
                Save
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setIsAddingProfile(false);
                  setNewProfileName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-list">
        {profiles.map((profile) => (
          <div
            key={profile.id || profile.name}
            className={`profile-item ${activeProfile === profile.name ? "active" : ""}`}
            onClick={() => onProfileSelect(profile.id || profile.name)}
          >
            <div className="profile-item-header">
              <span>{profile.name}</span>
              <div
                className="profile-actions"
                style={{ display: "flex", gap: "5px" }}
              >
                {/* Only show JSON options in dropdown if there are multiple profiles */}
                {profiles.length > 1 && (
                  <DropdownMenu
                    items={[
                      {
                        label: "Copy JSON to clipboard",
                        action: () => copyToClipboard(profile),
                      },
                      {
                        label: "Export JSON",
                        action: () => exportProfile(profile),
                      },
                    ]}
                    disabled={operationInProgress}
                  />
                )}
              </div>
            </div>
            <div className="profile-item-info">
              {(() => {
                const totalServers = profile.servers
                  ? Object.keys(profile.servers).length
                  : 0;
                if (totalServers === 0) return "0 servers";

                // Count enabled and disabled servers
                const servers = profile.servers || {};
                const enabledCount = Object.values(servers).filter(
                  (server) => server.enabled,
                ).length;
                const disabledCount = totalServers - enabledCount;

                // Display format
                if (disabledCount === 0) return `${enabledCount} enabled`;
                if (enabledCount === 0) return `${disabledCount} disabled`;
                return `${enabledCount} enabled, ${disabledCount} disabled`;
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSelector;
