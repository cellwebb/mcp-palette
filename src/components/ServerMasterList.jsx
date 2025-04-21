import React from "react";
import DropdownMenu from "./DropdownMenu";
import { getServerDisplayName } from "../utils/profileUtils";
import ConfirmButton from "./ConfirmButton";

const ServerMasterList = ({
  servers,
  selectedServer,
  onSelectServer,
  onAddServer,
  onDeleteServer,
  onViewServerJson,
  onRestoreDefaults,
  profiles = [], // Added profiles prop with default
}) => {
  // Helper function to check if a server is used in any enabled profile
  const isServerInUse = (serverId) => {
    return profiles.some(
      (profile) =>
        profile.servers &&
        profile.servers[serverId] &&
        profile.servers[serverId].enabled,
    );
  };
  if (!servers || Object.keys(servers).length === 0) {
    return (
      <div className="empty-state">
        <p>No servers in Master List yet. Add a server to get started.</p>
        <button
          className="button button-primary"
          onClick={onAddServer}
          style={{ marginTop: "10px" }}
        >
          Add Server to Master List
        </button>
      </div>
    );
  }

  return (
    <div className="server-master-list">
      <div className="server-list-header">
        <h2>Server Master List</h2>
      </div>

      {Object.entries(servers).map(([serverId, serverData]) => {
        const serverName = getServerDisplayName(serverData);

        return (
          <div
            key={serverId}
            className={`server-master-item ${selectedServer === serverId ? "active" : ""}`}
            onClick={() => onSelectServer(serverId)}
          >
            <div className="server-master-item-header">
              <div className="server-master-item-name">{serverName}</div>
              <div className="server-master-item-actions">
                <DropdownMenu
                  items={[
                    {
                      label: "Copy JSON to clipboard",
                      action: () => {
                        const serverConfig = JSON.stringify(
                          {
                            id: serverId,
                            ...serverData,
                          },
                          null,
                          2,
                        );
                        navigator.clipboard
                          .writeText(serverConfig)
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
                      label: "View JSON",
                      action: () => onViewServerJson(serverId),
                      icon: "📑",
                    },
                    {
                      label: "Restore Defaults",
                      action: async () => {
                        const confirmed = await window.api.safeConfirm(
                          `Restore default configuration for server "${serverName}"?`,
                        );
                        if (confirmed) {
                          // Call restore function passed as prop
                          onRestoreDefaults(serverId);
                        }
                      },
                      icon: "🔄",
                    },
                    {
                      label: "Delete Server",
                      action: async () => {
                        const confirmed = await window.api.safeConfirm(
                          `Are you sure you want to delete the server "${serverName}"?`,
                        );
                        if (confirmed) {
                          onDeleteServer(serverId);
                        }
                      },
                      icon: "🗑️",
                      type: "danger",
                    },
                  ]}
                />
              </div>
            </div>
            <div className="server-master-item-details">
              <div className="server-master-item-command">
                <code>
                  {serverData.command} {(serverData.args || []).join(" ")}
                </code>
              </div>
              {serverData.env && Object.keys(serverData.env).length > 0 && (
                <div className="server-master-item-env-vars">
                  <span>
                    {Object.keys(serverData.env).length} environment variables
                  </span>
                </div>
              )}
              {serverData.originalId &&
                serverData.originalId !== serverName && (
                  <div className="server-master-item-original-id">
                    <span className="server-id-label">Original ID:</span>{" "}
                    {serverData.originalId}
                  </div>
                )}

              {/* Add delete button for servers not in use */}
              {!isServerInUse(serverId) && (
                <div style={{ marginTop: "10px" }}>
                  <ConfirmButton
                    label="Delete Server"
                    confirmMessage={`Are you sure you want to delete the server "${serverName}"?`}
                    onConfirm={() => onDeleteServer(serverId)}
                    className="button button-small button-danger"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ServerMasterList;
