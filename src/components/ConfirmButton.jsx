import React from "react";

/**
 * A simple button that shows a confirmation dialog before executing an action
 */
const ConfirmButton = ({
  label,
  confirmMessage,
  onConfirm,
  className = "button button-secondary",
  style = {},
}) => {
  // Handle the click with confirmation
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling

    // Show the confirmation dialog
    const confirmed = window.confirm(confirmMessage);

    // Debug log
    console.log("Confirmation result:", confirmed);

    // If confirmed, call the provided callback
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <button className={className} onClick={handleClick} style={style}>
      {label}
    </button>
  );
};

export default ConfirmButton;
