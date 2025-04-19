import { useState, useEffect } from "react";
import DropdownMenu from "./DropdownMenu";
import ConfirmationModal from "./ConfirmationModal";
import SimpleRenameModal from "./SimpleRenameModal";

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

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      await window.api.safeAlert("Profile name cannot be empty");
      return;
    }

    // Check for duplicate names
    if (
      profiles.some(
        (p) => p.name.toLowerCase() === newProfileName.trim().toLowerCase(),
      )
    ) {
      await window.api.safeAlert(
        `A profile with the name "${newProfileName.trim()}" already exists`,
      );
      return;
    }

    setOperationInProgress(true);
    try {
      onAddProfile(newProfileName.trim());
      setNewProfileName("");
    } catch (error) {
      console.error("Error adding profile:", error);
      await window.api.safeAlert(error.message || "Failed to add profile");
    } finally {
      setOperationInProgress(false);
    }
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
  const initiateDeleteProfile = async (profileName) => {
    if (profiles.length <= 1) {
      await window.api.safeAlert("Cannot delete the last remaining profile");
      return;
    }

    setProfileToDelete(profileName);
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
      await window.api.safeAlert(
        `Failed to delete profile: ${error.message || "Unknown error"}`,
      );
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
      await window.api.safeAlert(
        `Profile '${profile.name}' copied to clipboard`,
      );
    } catch (err) {
      console.error("Failed to copy profile to clipboard: ", err);
      await window.api.safeAlert("Failed to copy to clipboard");
    }
  };

  return (
    <div className="profile-selector">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete Profile"
          message={`Are you sure you want to delete the profile "${profileToDelete}"? This action cannot be undone.`}
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
          <input
            type="text"
            placeholder="Profile Name"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            autoFocus
          />
          <div className="profile-form-actions">
            <button
              className="button button-primary"
              onClick={handleAddProfile}
              disabled={!newProfileName.trim() || operationInProgress}
            >
              Save
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                setIsAddingProfile(false);
                setNewProfileName("");
              }}
              disabled={operationInProgress}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="profile-list">
        {profiles.map((profile) => (
          <div
            key={profile.name}
            className={`profile-item ${activeProfile === profile.name ? "active" : ""}`}
            onClick={() => onProfileSelect(profile.name)}
          >
            <div className="profile-item-header">
              <span>{profile.name}</span>
              <div
                className="profile-actions"
                style={{ display: "flex", gap: "5px" }}
              >
                <button
                  className="button button-small button-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!operationInProgress) startRenaming(profile.name);
                  }}
                  disabled={operationInProgress}
                >
                  Rename
                </button>
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
                      {
                        label: "Delete Profile",
                        action: () => initiateDeleteProfile(profile.name),
                        type: "danger",
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
