import { useState } from "react";
import DropdownMenu from "./DropdownMenu";

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

  const handleAddProfile = () => {
    onAddProfile(newProfileName);
    setNewProfileName("");
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
  const copyToClipboard = (profile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    navigator.clipboard
      .writeText(dataStr)
      .then(() => {
        alert(`Profile '${profile.name}' copied to clipboard`);
      })
      .catch((err) => {
        console.error("Failed to copy profile to clipboard: ", err);
        alert("Failed to copy to clipboard");
      });
  };

  return (
    <div className="profile-selector">
      <div className="profile-selector-header">
        <h2>Profiles</h2>
        <button
          className="button button-primary"
          onClick={() => setIsAddingProfile(true)}
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
          />
          <div className="profile-form-actions">
            <button
              className="button button-primary"
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
            >
              Save
            </button>
            <button
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
                      label: "Rename Profile",
                      action: () => onRenameProfile(profile.name),
                    },
                    {
                      label: "Delete Profile",
                      action: () => onDeleteProfile(profile.name),
                      type: "danger",
                    },
                  ]}
                />
              )}
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
