import React from "react";

const ConfirmationModal = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
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
            {cancelText}
          </button>
          <button className="button button-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
