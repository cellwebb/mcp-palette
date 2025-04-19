import React from "react";

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  // Debug log
  console.log("ConfirmationModal rendered with:", { isOpen, title, message });

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
        backgroundColor:
          "rgba(0, 0, 0, 0.7)" /* Darker background for visibility */,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999 /* Increased z-index */,
      }}
      onClick={onCancel}
    >
      {/* Debug indicator */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          color: "white",
          padding: "5px 10px",
          backgroundColor: "red",
        }}
      >
        MODAL VISIBLE
      </div>
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

        <div className="modal-body" style={{ margin: "15px 0" }}>
          <p>{message}</p>
        </div>

        <div
          className="modal-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button button-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
