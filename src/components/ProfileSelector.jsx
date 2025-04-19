import { useState } from "react";

const ProfileSelector = ({
  profiles,
  activeProfile,
  onProfileSelect,
  onAddProfile,
  onDeleteProfile,
  isAddingProfile,
  setIsAddingProfile,
}) => {
  const [newProfileName, setNewProfileName] = useState("");

  const handleAddProfile = () => {
    onAddProfile(newProfileName);
    setNewProfileName("");
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
                <button
                  className="button button-small button-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProfile(profile.name);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="profile-item-info">
              {profile.servers ? Object.keys(profile.servers).length : 0}{" "}
              servers
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSelector;
