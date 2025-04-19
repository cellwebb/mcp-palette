import React from "react";

const ServerMasterList = ({
  servers,
  selectedServer,
  onSelectServer,
  onAddServer,
  onDeleteServer,
}) => {
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

      {Object.entries(servers).map(([serverId, serverData]) => (
        <div
          key={serverId}
          className={`server-master-item ${selectedServer === serverId ? "active" : ""}`}
          onClick={() => onSelectServer(serverId)}
        >
          <div className="server-master-item-header">
            <div className="server-master-item-name">{serverData.name}</div>
            <div className="server-master-item-actions">
              <button
                className="button button-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteServer(serverId);
                }}
              >
                Delete
              </button>
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServerMasterList;
