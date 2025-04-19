import React from "react";
import { getEffectiveConfig, hasOverrides } from "../utils/helpers";
import DropdownMenu from "./DropdownMenu";

const ProfileServerList = ({
  profile,
  masterServers,
  selectedServer,
  onSelectServer,
  onToggleServer,
  onEditOverrides,
  onRemoveServer,
  onRestoreDefaults,
}) => {
  if (
    !profile ||
    !profile.servers ||
    Object.keys(profile.servers).length === 0
  ) {
    return (
      <div className="empty-state">
        <p>
          No servers in this profile. Add servers from the Server Master List.
        </p>
      </div>
    );
  }

  return (
    <div className="profile-server-list">
      <h2>Servers in {profile.name}</h2>

      {Object.entries(masterServers).map(([serverId, masterData]) => {
        const profileServer = profile.servers[serverId] || {
          enabled: false,
          overrides: {},
        };
        const effectiveConfig = getEffectiveConfig(masterData, profileServer);
        const hasServerOverrides = hasOverrides(profileServer.overrides);

        if (!profile.servers[serverId]) {
          return null; // Don't show servers not in this profile
        }

        return (
          <div
            key={serverId}
            className={`profile-server-item ${profileServer.enabled ? "" : "disabled"} ${selectedServer === serverId ? "active" : ""}`}
            onClick={() => onSelectServer(serverId)}
          >
            <div className="profile-server-header">
              <div className="profile-server-name">
                {masterData.name}
                {hasServerOverrides && (
                  <span className="override-indicator">Customized</span>
                )}
              </div>
              <div className="profile-server-actions">
                <div
                  className="profile-server-enabled-toggle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={profileServer.enabled || false}
                      onChange={() => onToggleServer(serverId)}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                  <span>{profileServer.enabled ? "Enabled" : "Disabled"}</span>
                </div>
                <DropdownMenu
                  items={[
                    {
                      label: "Copy JSON to clipboard",
                      action: () => {
                        const configData = JSON.stringify(
                          effectiveConfig,
                          null,
                          2,
                        );
                        navigator.clipboard
                          .writeText(configData)
                          .then(() => {
                            alert(`Server configuration copied to clipboard`);
                          })
                          .catch((err) => {
                            console.error("Failed to copy to clipboard: ", err);
                            alert("Failed to copy to clipboard");
                          });
                      },
                      icon: "📋",
                    },
                    {
                      label: "Edit Overrides",
                      action: (e) => {
                        onEditOverrides(serverId);
                      },
                      icon: "✏️",
                    },
                    {
                      label: "Restore Defaults",
                      action: () => {
                        if (
                          confirm(
                            `Restore default configuration for ${masterData.name}? This will remove all customizations.`,
                          )
                        ) {
                          onRestoreDefaults(serverId, profile.name);
                        }
                      },
                      icon: "🔄",
                    },
                    {
                      label: "Remove from Profile",
                      action: () => {
                        if (
                          confirm(
                            `Remove ${masterData.name} from this profile?`,
                          )
                        ) {
                          onRemoveServer(serverId);
                        }
                      },
                      icon: "🗑️",
                      type: "danger",
                    },
                  ]}
                />
              </div>
            </div>

            <div className="profile-server-details">
              <div>
                <strong>Command:</strong> {effectiveConfig.command}{" "}
                {(effectiveConfig.args || []).join(" ")}
              </div>

              {effectiveConfig.env &&
                Object.keys(effectiveConfig.env).length > 0 && (
                  <div style={{ marginTop: "5px" }}>
                    <strong>Environment Variables:</strong>{" "}
                    {Object.keys(effectiveConfig.env).length}
                  </div>
                )}

              <div style={{ marginTop: "10px" }}>
                <button
                  className="button button-small button-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditOverrides(serverId);
                  }}
                >
                  {hasServerOverrides ? "Edit Overrides" : "Add Overrides"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileServerList;
