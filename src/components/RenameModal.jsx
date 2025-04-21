import React, { useState, useEffect } from "react";

const RenameModal = ({
  isOpen,
  title,
  initialName,
  onConfirm,
  onCancel,
  profiles = [],
}) => {
  const [newName, setNewName] = useState(initialName || "");
  const [error, setError] = useState(null);

  // Reset the input field when the modal opens with a new name
  useEffect(() => {
    if (isOpen) {
      setNewName(initialName || "");
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const input = document.getElementById("rename-input");
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
    }
  }, [isOpen, initialName]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    processRename();
  };

  // Process rename with validation
  const processRename = () => {
    // Validate input
    if (!newName.trim()) {
      setError("Profile name cannot be empty");
      return;
    }

    // No change - early exit without error
    if (newName.trim() === initialName) {
      onCancel();
      return;
    }

    // Check for duplicate names
    if (
      profiles.some(
        (p) =>
          p.name.toLowerCase() === newName.trim().toLowerCase() &&
          p.name !== initialName,
      )
    ) {
      setError(`A profile with the name "${newName.trim()}" already exists`);
      return;
    }

    // Call the API through the parent component's callback
    try {
      // We need to pass the parameters as an object
      onConfirm({ oldName: initialName, newName: newName.trim() });
    } catch (err) {
      setError(err.message || "Failed to rename profile");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "4px",
          minWidth: "300px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              color: "red",
              marginBottom: "10px",
              padding: "5px",
              backgroundColor: "#ffeeee",
              borderRadius: "3px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ margin: "15px 0" }}>
            <input
              id="rename-input"
              type="text"
              className="form-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div
            className="modal-actions"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className="button button-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={!newName.trim() || newName.trim() === initialName}
              onClick={processRename}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
