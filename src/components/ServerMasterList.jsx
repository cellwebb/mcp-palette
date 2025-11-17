import React, { useState } from "react";
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
  const [sortBy, setSortBy] = useState("name"); // name, command

  // Helper function to check if a server is used in any enabled profile
  const isServerInUse = (serverId) => {
    return profiles.some(
      (profile) =>
        profile.servers &&
        profile.servers[serverId] &&
        profile.servers[serverId].enabled,
    );
  };

  // Sort servers based on current sort option
  const getSortedServers = () => {
    const serverEntries = Object.entries(servers);

    switch (sortBy) {
      case "name":
        return serverEntries.sort(([, a], [, b]) => {
          const nameA = getServerDisplayName(a).toLowerCase();
          const nameB = getServerDisplayName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case "command":
        return serverEntries.sort(([, a], [, b]) => {
          const cmdA = (a.command || "").toLowerCase();
          const cmdB = (b.command || "").toLowerCase();
          return cmdA.localeCompare(cmdB);
        });
      default:
        return serverEntries;
    }
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
        <div className="server-list-actions">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="command">Command</option>
            </select>
          </div>
          <button className="button button-primary" onClick={onAddServer}>
            Add New Server
          </button>
        </div>
      </div>

      {getSortedServers().map(([serverId, serverData]) => {
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
                      label: "Preview JSON",
                      action: () => onViewServerJson(serverId),
                      icon: "📑",
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
