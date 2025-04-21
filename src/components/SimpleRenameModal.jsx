import React, { useState, useEffect } from "react";
import { findProfileByIdOrName } from "../utils/profileUtils";

const SimpleRenameModal = ({
  isOpen,
  profileName,
  onSuccess,
  onCancel,
  profiles = [], // Added profiles prop for validation
  onRenameProfile = null, // Add access to the App-level rename function
}) => {
  const [newName, setNewName] = useState(profileName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset the input field when the modal opens with a new name
  useEffect(() => {
    if (isOpen) {
      setNewName(profileName || "");
      setError(null);
      setIsSubmitting(false);

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const input = document.getElementById("simple-rename-input");
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
    }
  }, [isOpen, profileName]);

  // Process the rename with improved validation and error handling
  const processRename = async () => {
    // Validate input
    if (!newName.trim()) {
      setError("Profile name cannot be empty");
      return;
    }

    // No change - early exit without error
    if (newName.trim() === profileName) {
      onCancel();
      return;
    }

    // Check for duplicate names directly in the component
    if (
      profiles.some(
        (p) =>
          p.name.toLowerCase() === newName.trim().toLowerCase() &&
          p.name !== profileName,
      )
    ) {
      setError(`A profile with the name "${newName.trim()}" already exists`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(
        `Attempting to rename profile from ${profileName} to ${newName.trim()}`,
      );

      // Find the profile by name to get its ID
      const profile = profiles.find((p) => p.name === profileName);
      if (!profile) {
        throw new Error(`Profile "${profileName}" not found`);
      }

      // Try different approaches to ensure it works
      let updatedProfiles;

      // If onRenameProfile is available, use it (this is the App-level function)
      if (onRenameProfile) {
        try {
          // First try with object format
          updatedProfiles = await onRenameProfile({
            oldName: profileName,
            newName: newName.trim(),
          });
        } catch (innerErr) {
          console.warn(
            "Failed with object format, trying legacy format",
            innerErr,
          );
          // Fall back to legacy format with separate parameters
          updatedProfiles = await onRenameProfile(profileName, newName.trim());
        }
      } else {
        // Direct API call - this will perform all necessary validations on the backend
        updatedProfiles = await window.api.renameProfile({
          oldName: profileName,
          newName: newName.trim(),
        });
      }

      console.log("Rename successful:", updatedProfiles);

      // Notify parent
      onSuccess(updatedProfiles);
    } catch (err) {
      console.error("Failed to rename profile:", err);

      // Try to provide a more user-friendly error message
      if (err.message && err.message.includes("already exists")) {
        setError(`A profile with the name "${newName.trim()}" already exists`);
      } else if (err.message && err.message.includes("is not a function")) {
        setError("Internal error: The rename function is not available");
        console.error(
          "API method missing: window.api.renameProfile is not a function",
        );
      } else {
        setError(err.message || "Failed to rename profile");
      }

      setIsSubmitting(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSubmitting && newName.trim() && newName.trim() !== profileName) {
      processRename();
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
          <h2>Rename Profile</h2>
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
              id="simple-rename-input"
              type="text"
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
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancel();
                }
              }}
              autoFocus
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
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={
                isSubmitting ||
                !newName.trim() ||
                newName.trim() === profileName
              }
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isSubmitting ||
                  !newName.trim() ||
                  newName.trim() === profileName
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isSubmitting ||
                  !newName.trim() ||
                  newName.trim() === profileName
                    ? 0.7
                    : 1,
              }}
            >
              {isSubmitting ? "Saving..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleRenameModal;
