import { useState } from "react";
import {
  filterInternalFields,
  getEffectiveConfig,
  hasOverrides,
} from "../utils/helpers";
import { getServerDisplayName } from "../utils/profileUtils";
import ConfirmButton from "./ConfirmButton";
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
  const [sortBy, setSortBy] = useState("name"); // name, command, enabled

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

  // Get list of server IDs in this profile
  const profileServerIds = Object.keys(profile.servers);

  // Sort profile servers
  const getSortedServerIds = () => {
    const serverIds = [...profileServerIds];

    switch (sortBy) {
      case "name":
        return serverIds.sort((a, b) => {
          const masterA = masterServers[a];
          const masterB = masterServers[b];
          if (!masterA || !masterB) return 0;
          const nameA = getServerDisplayName(masterA).toLowerCase();
          const nameB = getServerDisplayName(masterB).toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case "command":
        return serverIds.sort((a, b) => {
          const masterA = masterServers[a];
          const masterB = masterServers[b];
          if (!masterA || !masterB) return 0;
          const cmdA = (masterA.command || "").toLowerCase();
          const cmdB = (masterB.command || "").toLowerCase();
          return cmdA.localeCompare(cmdB);
        });
      case "enabled":
        return serverIds.sort((a, b) => {
          const enabledA = profile.servers[a]?.enabled || false;
          const enabledB = profile.servers[b]?.enabled || false;
          // Sort enabled first (true > false)
          return enabledB - enabledA;
        });
      default:
        return serverIds;
    }
  };

  return (
    <div className="profile-server-list">
      <div className="profile-server-list-header">
        <div className="sort-controls">
          <label htmlFor="profile-sort-select">Sort by:</label>
          <select
            id="profile-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="command">Command</option>
            <option value="enabled">Status (Enabled/Disabled)</option>
          </select>
        </div>
      </div>
      {getSortedServerIds().map((serverId) => {
        const masterData = masterServers[serverId];
        // Skip if master server no longer exists
        if (!masterData) return null;

        const profileServer = profile.servers[serverId] || {
          enabled: false,
          overrides: {},
        };
        const effectiveConfig = getEffectiveConfig(masterData, profileServer);
        const hasServerOverrides = hasOverrides(profileServer.overrides);
        const serverName = getServerDisplayName(masterData);

        return (
          <div
            key={serverId}
            className={`profile-server-item ${profileServer.enabled ? "" : "disabled"} ${selectedServer === serverId ? "active" : ""}`}
            onClick={() => onSelectServer(serverId)}
          >
            <div className="profile-server-header">
              <div className="profile-server-name">
                {serverName}
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
                      action: async function () {
                        // Filter out internal fields before copying
                        const mcpConfig = filterInternalFields(effectiveConfig);
                        const configData = JSON.stringify(mcpConfig, null, 2);

                        try {
                          await navigator.clipboard.writeText(configData);
                          await window.api.safeAlert(
                            `Server configuration copied to clipboard`,
                          );
                        } catch (err) {
                          console.error("Failed to copy to clipboard: ", err);
                          await window.api.safeAlert(
                            "Failed to copy to clipboard",
                          );
                        }
                      },
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

              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button
                  className="button button-small button-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditOverrides(serverId);
                  }}
                >
                  {hasServerOverrides ? "Edit Overrides" : "Add Overrides"}
                </button>

                {hasServerOverrides && (
                  <ConfirmButton
                    label="Restore Defaults"
                    confirmMessage={`Restore default configuration for ${serverName}? This will remove all customizations.`}
                    onConfirm={() => onRestoreDefaults(serverId, profile.name)}
                    className="button button-small button-secondary"
                  />
                )}

                <ConfirmButton
                  label="Remove server from profile"
                  confirmMessage={`Remove ${serverName} from profile '${profile.name}'?`}
                  onConfirm={() => onRemoveServer(serverId)}
                  className="button button-small button-danger"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileServerList;
