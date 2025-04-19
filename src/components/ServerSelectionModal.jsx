import { useState } from "react";
import { getServerDisplayName } from "../utils/profileUtils";

const ServerSelectionModal = ({
  show,
  onClose,
  serverMasterList,
  onAddServer,
}) => {
  const [selectedServers, setSelectedServers] = useState({});

  if (!show) return null;

  const handleToggleServer = (serverId) => {
    setSelectedServers((prev) => ({
      ...prev,
      [serverId]: !prev[serverId],
    }));
  };

  const handleAddSelectedServers = async () => {
    // Get list of selected server IDs
    const serverIds = Object.entries(selectedServers)
      .filter(([_, isSelected]) => isSelected)
      .map(([serverId]) => serverId);

    // Add each selected server to the profile
    if (serverIds.length > 0) {
      // Show a confirmation for multiple servers
      if (serverIds.length > 1) {
        const confirmed = await window.api.safeConfirm(
          `Add ${serverIds.length} servers to your profile?`,
        );
        if (!confirmed) return;
      }

      serverIds.forEach((serverId) => {
        onAddServer(serverId);
      });

      // Close the modal
      onClose();
    } else {
      await window.api.safeAlert("Please select at least one server to add.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Servers from Master List</h2>
          <button
            className="button button-small button-secondary"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="server-selection-list">
          {Object.keys(serverMasterList).length === 0 ? (
            <p>No servers available in the Master List.</p>
          ) : (
            <>
              <p>Select servers to add to your profile:</p>
              {Object.entries(serverMasterList).map(
                ([serverId, serverData]) => {
                  const serverName = getServerDisplayName(serverData);
                  return (
                    <div key={serverId} className="server-selection-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedServers[serverId] || false}
                          onChange={() => handleToggleServer(serverId)}
                        />
                        <span className="server-name">{serverName}</span>
                        <span className="server-details">
                          <code>
                            {serverData.command}{" "}
                            {(serverData.args || []).join(" ")}
                          </code>
                        </span>
                      </label>
                      {serverData.originalId &&
                        serverData.originalId !== serverName && (
                          <div className="server-original-id">
                            <small>Original ID: {serverData.originalId}</small>
                          </div>
                        )}
                    </div>
                  );
                },
              )}
            </>
          )}
        </div>

        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleAddSelectedServers}
            disabled={
              Object.values(selectedServers).filter(Boolean).length === 0
            }
          >
            Add Selected Servers
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerSelectionModal;
