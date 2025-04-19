import { useState } from "react";

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

  const handleAddSelectedServers = () => {
    // Get list of selected server IDs
    const serverIds = Object.entries(selectedServers)
      .filter(([_, isSelected]) => isSelected)
      .map(([serverId]) => serverId);

    // Add each selected server to the profile
    if (serverIds.length > 0) {
      serverIds.forEach((serverId) => {
        onAddServer(serverId);
      });

      // Close the modal
      onClose();
    } else {
      alert("Please select at least one server to add.");
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
                ([serverId, serverData]) => (
                  <div key={serverId} className="server-selection-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedServers[serverId] || false}
                        onChange={() => handleToggleServer(serverId)}
                      />
                      <span className="server-name">{serverData.name}</span>
                      <span className="server-details">
                        <code>
                          {serverData.command}{" "}
                          {(serverData.args || []).join(" ")}
                        </code>
                      </span>
                    </label>
                  </div>
                ),
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
