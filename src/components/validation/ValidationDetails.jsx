import React, { useState } from "react";
import "./ValidationDetails.css";

/**
 * A component that displays detailed validation information
 *
 * @param {Object} validationResult - The validation result from mcpValidator
 * @param {Function} onApplyFix - Handler for applying suggested fixes
 * @param {Function} onClose - Handler for closing the details view
 */
const ValidationDetails = ({ validationResult, onApplyFix, onClose }) => {
  const [tab, setTab] = useState("errors");
  const { errors = [], warnings = [] } = validationResult || {};

  // If no validation result or no issues, show empty state
  if (!validationResult || (errors.length === 0 && warnings.length === 0)) {
    return (
      <div className="validation-details-container">
        <div className="validation-details-header">
          <h3>Validation Results</h3>
          {onClose && (
            <button className="validation-details-close" onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        <div className="validation-details-empty">
          <p>No validation issues found. Configuration is valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="validation-details-container">
      <div className="validation-details-header">
        <h3>Validation Results</h3>
        {onClose && (
          <button className="validation-details-close" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      <div className="validation-details-tabs">
        <button
          className={`validation-tab ${tab === "errors" ? "active" : ""}`}
          onClick={() => setTab("errors")}
        >
          Errors ({errors.length})
        </button>
        <button
          className={`validation-tab ${tab === "warnings" ? "active" : ""}`}
          onClick={() => setTab("warnings")}
        >
          Warnings ({warnings.length})
        </button>
      </div>

      <div className="validation-details-content">
        {tab === "errors" && (
          <div className="validation-section validation-errors-section">
            {errors.length === 0 ? (
              <p className="validation-no-issues">No errors found.</p>
            ) : (
              <table className="validation-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Issue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((error, index) => (
                    <tr key={`error-${index}`} className="validation-error-row">
                      <td className="validation-path">
                        {error.path || "<root>"}
                      </td>
                      <td>{error.message}</td>
                      <td className="validation-actions">
                        {error.suggestion && (
                          <button
                            className="button button-small"
                            onClick={() => onApplyFix(error)}
                            title={
                              error.suggestion.description ||
                              "Apply suggested fix"
                            }
                          >
                            Fix
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "warnings" && (
          <div className="validation-section validation-warnings-section">
            {warnings.length === 0 ? (
              <p className="validation-no-issues">No warnings found.</p>
            ) : (
              <table className="validation-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Issue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((warning, index) => (
                    <tr
                      key={`warning-${index}`}
                      className="validation-warning-row"
                    >
                      <td className="validation-path">
                        {warning.path || "<root>"}
                      </td>
                      <td>{warning.message}</td>
                      <td className="validation-actions">
                        {warning.suggestion && (
                          <button
                            className="button button-small button-secondary"
                            onClick={() => onApplyFix(warning)}
                            title={
                              warning.suggestion.description ||
                              "Apply suggested fix"
                            }
                          >
                            Fix
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Footer with helpful information */}
      <div className="validation-details-footer">
        <div className="validation-summary">
          <p>
            {validationResult.valid
              ? "Configuration is valid" +
                (warnings.length > 0 ? " with warnings" : "")
              : "Configuration has validation errors"}
          </p>
        </div>
        <div className="validation-help">
          <p>
            <strong>Note:</strong> Errors must be fixed for MCP compliance.
            Warnings are suggestions for best practices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidationDetails;
