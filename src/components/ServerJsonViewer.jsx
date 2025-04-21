import React, { useEffect, useState } from "react";
import JsonEditor from "./JsonEditor";
import { filterInternalFields } from "../utils/helpers";
import {
  validateMcpServerConfig,
  formatSingleServerConfig,
} from "../utils/validation/mcpValidator";
import { ValidationBadge, ValidationDetails } from "./validation";
import "./ServerJsonViewer.css";

/**
 * Component for viewing server configuration as JSON with validation
 */
const ServerJsonViewer = ({ server, serverId, onBack, onUpdateServer }) => {
  // State for validation and UI
  const [validationResult, setValidationResult] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Format server object for JSON display - filter out internal fields
  const serverJson = filterInternalFields(server);

  // Format as an MCP compliant JSON structure using the standard formatter
  const serverFormatted = formatSingleServerConfig(serverJson);
  const mcpJson = {
    [server.name || serverId]: serverFormatted,
  };

  // Validate the configuration when component mounts or server changes
  useEffect(() => {
    const result = validateMcpServerConfig(serverJson, server.name || serverId);
    setValidationResult({
      valid: result.errors.length === 0,
      errors: result.errors,
      warnings: result.warnings,
    });
  }, [server, serverId]);

  // Set page title to indicate JSON view mode
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `MCP Palette - JSON: ${server.name}`;

    return () => {
      document.title = originalTitle;
    };
  }, [server.name]);

  // Handle applying suggested fixes
  const handleApplyFix = (issue) => {
    if (!issue.suggestion || !onUpdateServer) return;

    // In a real implementation, this would apply the fix and update the server
    // For now, we'll just log the suggestion
    console.log("Would apply fix:", issue.suggestion);
    alert("Fix application will be implemented in the next phase");
  };

  // Toggle validation details visibility
  const toggleValidationDetails = () => {
    setShowValidationDetails(!showValidationDetails);
  };

  return (
    <div className="server-json-viewer">
      <div className="server-json-header">
        <div className="server-json-title">
          <h2>
            MCP Configuration JSON - Server: {server.name}{" "}
            <span className="readonly-badge">🔒 Read-Only</span>
          </h2>
        </div>

        <div className="server-json-controls">
          {/* Validation badge */}
          <ValidationBadge
            validationResult={validationResult}
            showDetails={true}
            onClick={toggleValidationDetails}
          />

          <button className="button button-secondary" onClick={onBack}>
            Back to Form
          </button>
        </div>
      </div>

      {/* Validation details panel */}
      {showValidationDetails && validationResult && (
        <ValidationDetails
          validationResult={validationResult}
          onApplyFix={handleApplyFix}
          onClose={() => setShowValidationDetails(false)}
        />
      )}

      {/* JSON Editor */}
      <JsonEditor json={JSON.stringify(mcpJson, null, 2)} readOnly={true} />
    </div>
  );
};

export default ServerJsonViewer;
