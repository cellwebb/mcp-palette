import React from "react";
import "./ValidationBadge.css";

/**
 * A component that displays the validation status of a configuration
 *
 * @param {Object} validationResult - The validation result from mcpValidator
 * @param {boolean} showDetails - Whether to show validation details on hover
 * @param {Function} onClick - Click handler for the badge
 */
const ValidationBadge = ({
  validationResult,
  showDetails = false,
  onClick,
}) => {
  // If no validation result, show "not validated" state
  if (!validationResult) {
    return (
      <div
        className="validation-badge validation-badge-unknown"
        onClick={onClick}
      >
        <span className="validation-badge-icon">?</span>
        <span className="validation-badge-text">Not validated</span>
      </div>
    );
  }

  const { valid, errors = [], warnings = [] } = validationResult;

  // Determine badge type based on validation results
  let badgeType = valid ? (warnings.length > 0 ? "warning" : "valid") : "error";

  // Badge text and icon based on type
  const badgeInfo = {
    valid: { text: "Valid", icon: "✔" },
    warning: { text: "Valid with warnings", icon: "⚠" },
    error: { text: "Invalid", icon: "✘" },
  };

  return (
    <div
      className={`validation-badge validation-badge-${badgeType}`}
      onClick={onClick}
    >
      <span className="validation-badge-icon">{badgeInfo[badgeType].icon}</span>
      {badgeInfo[badgeType].text}

      {showDetails && (badgeType === "warning" || badgeType === "error") && (
        <div className="validation-details-popup">
          {errors.length > 0 && (
            <div className="validation-errors">
              <h4>Errors ({errors.length})</h4>
              <ul>
                {errors.slice(0, 3).map((error, index) => (
                  <li key={`error-${index}`} className="validation-error-item">
                    <span className="validation-issue-path">{error.path}</span>:{" "}
                    {error.message}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li className="validation-more-item">
                    ...and {errors.length - 3} more error(s)
                  </li>
                )}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings ({warnings.length})</h4>
              <ul>
                {warnings.slice(0, 3).map((warning, index) => (
                  <li
                    key={`warning-${index}`}
                    className="validation-warning-item"
                  >
                    <span className="validation-issue-path">
                      {warning.path}
                    </span>
                    : {warning.message}
                  </li>
                ))}
                {warnings.length > 3 && (
                  <li className="validation-more-item">
                    ...and {warnings.length - 3} more warning(s)
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="validation-details-footer">
            Click for full details
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationBadge;
