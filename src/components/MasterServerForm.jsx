import { useState, useEffect } from "react";
import {
  validateMcpServerConfig,
  getValidationSummary,
  formatSingleServerConfig,
} from "../utils/validation/mcpValidator";
import { ValidationBadge } from "./validation";
import { validationPatterns } from "../utils/validation/mcpSchema";
import ServerJsonViewer from "./ServerJsonViewer";

const MasterServerForm = ({
  server,
  serverId,
  onSave,
  onCancel,
  onViewJson,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    command: "npx",
    args: [],
    env: {},
  });

  const [newArg, setNewArg] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [originalId, setOriginalId] = useState("");
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Add state for validation
  const [validationResult, setValidationResult] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Initialize form data when server changes
  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || "",
        command: server.command || "npx",
        args: server.args || [],
        env: server.env || {},
      });

      // Save original ID if it exists
      setOriginalId(server.originalId || "");
    } else {
      // Default values for new server
      setFormData({
        name: "",
        command: "npx",
        args: [],
        env: {},
      });
      setOriginalId("");
    }
  }, [server, serverId]);

  // Validate form data whenever it changes
  useEffect(() => {
    // Don't validate empty forms
    if (
      !formData.name &&
      !formData.command &&
      formData.args.length === 0 &&
      Object.keys(formData.env).length === 0
    ) {
      setValidationResult(null);
      return;
    }

    const result = validateMcpServerConfig(
      formData,
      formData.name || "Unnamed Server",
    );
    setValidationResult({
      valid: result.errors.length === 0,
      errors: result.errors,
      warnings: result.warnings,
    });
  }, [formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle adding an argument
  const handleAddArg = () => {
    if (!newArg.trim()) return;

    setFormData((prev) => ({
      ...prev,
      args: [...prev.args, newArg],
    }));

    setNewArg("");
  };

  // Handle removing an argument
  const handleRemoveArg = (index) => {
    setFormData((prev) => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index),
    }));
  };

  // Handle adding an environment variable
  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) return;

    setFormData((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [newEnvKey]: newEnvValue,
      },
    }));

    setNewEnvKey("");
    setNewEnvValue("");
  };

  // Handle removing an environment variable
  const handleRemoveEnvVar = (key) => {
    setFormData((prev) => {
      const { [key]: removed, ...restEnv } = prev.env;
      return {
        ...prev,
        env: restEnv,
      };
    });
  };

  // Generate preview JSON based on current form state
  const generatePreviewJson = () => {
    // Create a clean server object for JSON preview
    const serverData = { ...formData };

    // Add originalId if needed
    if (originalId) {
      serverData.originalId = originalId;
    } else if (formData.name) {
      // For new servers, set original ID to the name for preview
      serverData.originalId = formData.name;
    }

    // Remove empty properties
    if (formData.args && formData.args.length === 0) {
      delete serverData.args;
    }

    if (formData.env && Object.keys(formData.env).length === 0) {
      delete serverData.env;
    }

    return serverData;
  };

  // Handle JSON preview
  const handleViewJson = () => {
    setShowJsonPreview(true);
  };

  const handleBackFromJson = () => {
    setShowJsonPreview(false);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // The server ID will be generated automatically by the backend
    // Include original ID if it exists
    const serverData = { ...formData };
    if (originalId) {
      serverData.originalId = originalId;
    } else if (!server && formData.name) {
      // For new servers, set original ID to the name
      serverData.originalId = formData.name;
    }

    // Call onSave with the server ID if we're editing an existing server
    if (server && serverId) {
      // We're updating an existing server
      onSave(serverId, serverData);
    } else {
      // We're adding a new server
      onSave(serverData);
    }
  };

  // Check if env var name is valid
  const isValidEnvName = (name) => {
    return validationPatterns.envVarName.test(name);
  };

  // Show JSON preview if requested
  if (showJsonPreview) {
    return (
      <ServerJsonViewer
        server={generatePreviewJson()}
        serverId={formData.name || "new-server"}
        onBack={handleBackFromJson}
      />
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>
          {server ? "Edit Server in Master List" : "Add Server to Master List"}
        </h2>

        {/* Add validation badge */}
        {validationResult && (
          <div className="form-validation">
            <ValidationBadge
              validationResult={validationResult}
              showDetails={true}
              onClick={() => setShowValidationDetails(!showValidationDetails)}
            />
            {validationResult && !validationResult.valid && (
              <span className="validation-summary">
                {getValidationSummary(validationResult)}
              </span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Settings</h3>
          {originalId && (
            <div className="original-id-info">
              <small>Original ID: {originalId}</small>
            </div>
          )}

          <div className="form-row">
            <label htmlFor="name">Display Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Human-friendly name"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="command">Command</label>
            <input
              type="text"
              id="command"
              name="command"
              value={formData.command}
              onChange={handleChange}
              placeholder="Command to run (e.g., npx, python)"
              required
              className={
                formData.command &&
                !validationPatterns.safeCommand.test(formData.command)
                  ? "input-warning"
                  : ""
              }
            />
            {formData.command &&
              !validationPatterns.safeCommand.test(formData.command) && (
                <div className="input-message warning">
                  Warning: Command contains potentially unsafe characters
                </div>
              )}
          </div>
        </div>

        <div className="form-section">
          <h3>Arguments</h3>

          <div className="form-row">
            <div className="arg-input-group">
              <input
                type="text"
                value={newArg}
                onChange={(e) => setNewArg(e.target.value)}
                placeholder="Enter argument"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newArg.trim()) {
                    e.preventDefault();
                    handleAddArg();
                  }
                }}
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={handleAddArg}
              >
                Add
              </button>
            </div>
          </div>

          {formData.args.length > 0 && (
            <div className="args-list">
              {formData.args.map((arg, index) => (
                <div key={index} className="arg-item">
                  <code>{arg}</code>
                  <button
                    type="button"
                    className="button button-small button-danger"
                    onClick={() => handleRemoveArg(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Environment Variables</h3>

          <div className="form-row">
            <div className="env-var-input-group">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="Variable name"
                className={
                  newEnvKey && !isValidEnvName(newEnvKey) ? "input-warning" : ""
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newEnvKey.trim()) {
                    e.preventDefault();
                    if (
                      newEnvValue.trim() ||
                      window.confirm(
                        "Add environment variable with empty value?",
                      )
                    ) {
                      handleAddEnvVar();
                    }
                  }
                }}
              />
              <input
                type="text"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="Value"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newEnvKey.trim()) {
                    e.preventDefault();
                    handleAddEnvVar();
                  }
                }}
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={handleAddEnvVar}
                disabled={!newEnvKey.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {newEnvKey && !isValidEnvName(newEnvKey) && (
            <div className="input-message warning">
              Warning: Environment variable name should contain only letters,
              numbers, and underscores, and start with a letter or underscore
            </div>
          )}

          {Object.keys(formData.env).length > 0 && (
            <div className="env-vars-list">
              {Object.entries(formData.env).map(([key, value]) => (
                <div key={key} className="env-var-item">
                  <div className="env-var-key">
                    <code
                      className={!isValidEnvName(key) ? "env-var-warning" : ""}
                      title={
                        !isValidEnvName(key)
                          ? "Variable name format warning"
                          : ""
                      }
                    >
                      {key}
                    </code>
                  </div>
                  <div className="env-var-value">
                    <code>{value}</code>
                  </div>
                  <div className="env-var-actions">
                    <button
                      type="button"
                      className="button button-small button-danger"
                      onClick={() => handleRemoveEnvVar(key)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={!formData.name.trim() || !formData.command.trim()}
          >
            Save
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-info"
            onClick={handleViewJson}
          >
            View JSON
          </button>
        </div>
      </form>
    </div>
  );
};

export default MasterServerForm;
