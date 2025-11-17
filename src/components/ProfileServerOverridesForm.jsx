import { useState, useEffect } from "react";
import ServerJsonViewer from "./ServerJsonViewer";

const ProfileServerOverridesForm = ({
  serverId,
  profileName,
  masterServer,
  profileServer,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    command: "",
    args: [],
    env: {},
  });

  const [overrideFields, setOverrideFields] = useState({
    name: false,
    command: false,
    args: false,
    env: {},
  });

  // Track environment variables that should be removed
  const [removedEnvVars, setRemovedEnvVars] = useState({});
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const [newArg, setNewArg] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Initialize form data when inputs change
  useEffect(() => {
    if (masterServer && profileServer) {
      // Start with master list values
      setFormData({
        name: masterServer.name || "",
        command: masterServer.command || "",
        args: [...(masterServer.args || [])],
        env: { ...(masterServer.env || {}) },
      });

      // Apply overrides
      if (profileServer.overrides) {
        if (profileServer.overrides.name) {
          setFormData((prev) => ({
            ...prev,
            name: profileServer.overrides.name,
          }));
          setOverrideFields((prev) => ({ ...prev, name: true }));
        }

        if (profileServer.overrides.command) {
          setFormData((prev) => ({
            ...prev,
            command: profileServer.overrides.command,
          }));
          setOverrideFields((prev) => ({ ...prev, command: true }));
        }

        if (profileServer.overrides.args) {
          setFormData((prev) => ({
            ...prev,
            args: [...profileServer.overrides.args],
          }));
          setOverrideFields((prev) => ({ ...prev, args: true }));
        }

        if (profileServer.overrides.env) {
          const newEnv = { ...(masterServer.env || {}) };
          Object.entries(profileServer.overrides.env).forEach(
            ([key, value]) => {
              // Skip null values which indicate deletion
              if (value !== null) {
                newEnv[key] = value;
              }
            },
          );

          setFormData((prev) => ({ ...prev, env: newEnv }));

          const envOverrides = {};
          Object.keys(profileServer.overrides.env).forEach((key) => {
            // If the value is not null, it's a normal override
            if (profileServer.overrides.env[key] !== null) {
              envOverrides[key] = true;
            }
          });
          setOverrideFields((prev) => ({ ...prev, env: envOverrides }));
          
          // Track removed env vars
          const removedVars = {};
          Object.entries(profileServer.overrides.env).forEach(([key, value]) => {
            if (value === null) {
              removedVars[key] = true;
            }
          });
          setRemovedEnvVars(removedVars);
        }
      }
    } else if (masterServer) {
      // Just use master list values
      setFormData({
        name: masterServer.name || "",
        command: masterServer.command || "",
        args: [...(masterServer.args || [])],
        env: { ...(masterServer.env || {}) },
      });

      // No overrides
      setOverrideFields({
        name: false,
        command: false,
        args: false,
        env: {},
      });
      
      // No removed env vars
      setRemovedEnvVars({});
    }
  }, [masterServer, profileServer]);

  // Toggle field override status
  const toggleOverride = (field) => {
    setOverrideFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));

    // Reset to master list value if turning off override
    if (overrideFields[field] && masterServer) {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === "args"
            ? [...(masterServer[field] || [])]
            : masterServer[field] || "",
      }));
    }
  };

  // Toggle env variable override
  const toggleEnvOverride = (key) => {
    setOverrideFields((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [key]: !prev.env[key],
      },
    }));

    // Reset to master list value if turning off override
    if (overrideFields.env[key] && masterServer && masterServer.env) {
      setFormData((prev) => ({
        ...prev,
        env: {
          ...prev.env,
          [key]: masterServer.env[key] || "",
        },
      }));
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle env variable changes
  const handleEnvChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [key]: value,
      },
    }));
  };

  // Handle adding a new argument
  const handleAddArg = () => {
    if (!newArg.trim()) return;

    setFormData((prev) => ({
      ...prev,
      args: [...prev.args, newArg],
    }));

    // Make sure args override is enabled
    setOverrideFields((prev) => ({
      ...prev,
      args: true,
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

    // If this env var was previously removed, un-remove it
    if (removedEnvVars[newEnvKey]) {
      setRemovedEnvVars((prev) => {
        const updated = { ...prev };
        delete updated[newEnvKey];
        return updated;
      });
    }

    setFormData((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [newEnvKey]: newEnvValue,
      },
    }));

    // Set this env var as overridden
    setOverrideFields((prev) => ({
      ...prev,
      env: {
        ...prev.env,
        [newEnvKey]: true,
      },
    }));

    setNewEnvKey("");
    setNewEnvValue("");
  };

  // Handle removing an environment variable
  const handleRemoveEnvVar = (key) => {
    // First, remove from form data
    setFormData((prev) => {
      const { [key]: removed, ...restEnv } = prev.env;
      return {
        ...prev,
        env: restEnv,
      };
    });

    // If this is a master server env var, mark it as removed in overrides
    if (masterServer && masterServer.env && masterServer.env[key] !== undefined) {
      setRemovedEnvVars(prev => ({
        ...prev,
        [key]: true
      }));
    }

    // Always remove from override fields
    setOverrideFields((prev) => {
      const { [key]: removed, ...restEnvOverrides } = prev.env;
      return {
        ...prev,
        env: restEnvOverrides,
      };
    });
  };

  // Build the overrides object from form data
  const buildOverrides = () => {
    const overrides = {};

    if (overrideFields.name) {
      overrides.name = formData.name;
    }

    if (overrideFields.command) {
      overrides.command = formData.command;
    }

    if (overrideFields.args) {
      overrides.args = [...formData.args];
    }

    // Build env overrides
    const envOverrides = {};
    
    // Add normal env var overrides
    Object.entries(overrideFields.env).forEach(([key, isOverridden]) => {
      if (isOverridden && formData.env[key] !== undefined) {
        envOverrides[key] = formData.env[key];
      }
    });
    
    // Add removal overrides (explicit null values)
    Object.keys(removedEnvVars).forEach(key => {
      envOverrides[key] = null; // Set to null to indicate deletion
    });

    if (Object.keys(envOverrides).length > 0) {
      overrides.env = envOverrides;
    }

    return overrides;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const overrides = buildOverrides();

    onSave({
      enabled: profileServer ? profileServer.enabled : true,
      overrides,
    });
  };

  // Generate preview JSON based on current form state and overrides
  const generatePreviewJson = () => {
    // Create a server object with the effective configuration
    const effectiveServer = { ...masterServer };
    
    // Apply overrides from the form data based on which fields are being overridden
    if (overrideFields.name) {
      effectiveServer.name = formData.name;
    }
    
    if (overrideFields.command) {
      effectiveServer.command = formData.command;
    }
    
    if (overrideFields.args) {
      effectiveServer.args = [...formData.args];
    }
    
    // Handle environment variables
    effectiveServer.env = { ...masterServer.env };
    
    // Apply environment variable overrides
    Object.entries(overrideFields.env).forEach(([key, isOverridden]) => {
      if (isOverridden && formData.env[key] !== undefined) {
        effectiveServer.env[key] = formData.env[key];
      }
    });
    
    // Remove deleted environment variables
    Object.keys(removedEnvVars).forEach(key => {
      delete effectiveServer.env[key];
    });
    
    // If env is empty, remove it
    if (effectiveServer.env && Object.keys(effectiveServer.env).length === 0) {
      delete effectiveServer.env;
    }
    
    return effectiveServer;
  };

  // Handle JSON preview
  const handleViewJson = () => {
    setShowJsonPreview(true);
  };

  const handleBackFromJson = () => {
    setShowJsonPreview(false);
  };

  if (showJsonPreview) {
    return (
      <ServerJsonViewer 
        server={generatePreviewJson()} 
        serverId={serverId}
        onBack={handleBackFromJson}
        profileName={profileName}
      />
    );
  }

  if (!masterServer) {
    return (
      <div className="empty-state">
        <p>Server not found in master list.</p>
        <button className="button button-secondary" onClick={onCancel}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Customize {masterServer.name} Server for {profileName}</h2>
      <p>Override settings from the Server Master List.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Settings</h3>

          <div className="override-section">
            <div className="override-header">
              <label>
                <input
                  type="checkbox"
                  checked={overrideFields.name}
                  onChange={() => toggleOverride("name")}
                />
                Override Display Name
              </label>
            </div>

            {overrideFields.name && (
              <div className="override-content">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Custom name"
                />
              </div>
            )}

            {!overrideFields.name && (
              <div className="inherited-value">
                Using master list value: <strong>{masterServer.name}</strong>
              </div>
            )}
          </div>

          <div className="override-section">
            <div className="override-header">
              <label>
                <input
                  type="checkbox"
                  checked={overrideFields.command}
                  onChange={() => toggleOverride("command")}
                />
                Override Command
              </label>
            </div>

            {overrideFields.command && (
              <div className="override-content">
                <input
                  type="text"
                  name="command"
                  value={formData.command}
                  onChange={handleChange}
                  placeholder="Custom command"
                />
              </div>
            )}

            {!overrideFields.command && (
              <div className="inherited-value">
                Using master list value: <strong>{masterServer.command}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Arguments</h3>

          <div className="override-section">
            <div className="override-header">
              <label>
                <input
                  type="checkbox"
                  checked={overrideFields.args}
                  onChange={() => toggleOverride("args")}
                />
                Override Arguments
              </label>
            </div>

            {overrideFields.args && (
              <div className="override-content">
                <div className="form-row">
                  <div className="arg-input-group">
                    <input
                      type="text"
                      value={newArg}
                      onChange={(e) => setNewArg(e.target.value)}
                      placeholder="Enter argument"
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
            )}

            {!overrideFields.args && (
              <div className="inherited-value">
                Using master list values:{" "}
                <strong>{(masterServer.args || []).join(" ")}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Environment Variables</h3>
          <p className="env-help-text">
            Check the box next to a variable to override its value. Add new variables below - they will be merged with master list variables.
          </p>

          <div className="form-row">
            <div className="env-var-input-group">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="Variable name"
              />
              <input
                type="text"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="Value"
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={handleAddEnvVar}
              >
                Add New Variable
              </button>
            </div>
          </div>

          {Object.keys(formData.env).length > 0 && (
            <div className="env-vars-list">
              {Object.entries(formData.env).map(([key, value]) => (
                <div key={key} className="env-var-item">
                  <div className="env-var-key">
                    <label>
                      <input
                        type="checkbox"
                        checked={overrideFields.env[key] || false}
                        onChange={() => toggleEnvOverride(key)}
                      />
                      <code>{key}</code>
                    </label>
                  </div>
                  <div className="env-var-value">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleEnvChange(key, e.target.value)}
                      disabled={!overrideFields.env[key]}
                      className={
                        !overrideFields.env[key] ? "inherited-value" : ""
                      }
                    />
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
          
          {/* Show removed env vars */}
          {Object.keys(removedEnvVars).length > 0 && (
            <div className="removed-env-vars">
              <h4>Removed Environment Variables</h4>
              <div className="removed-env-list">
                {Object.keys(removedEnvVars).map(key => (
                  <div key={key} className="removed-env-item">
                    <code>{key}</code>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => {
                        // Restore this env var
                        const masterValue = masterServer.env ? masterServer.env[key] : '';
                        
                        // Add back to form data
                        setFormData(prev => ({
                          ...prev,
                          env: {
                            ...prev.env,
                            [key]: masterValue
                          }
                        }));
                        
                        // Remove from removed list
                        setRemovedEnvVars(prev => {
                          const updated = { ...prev };
                          delete updated[key];
                          return updated;
                        });
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="button button-primary">
            Save Overrides
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
            Preview JSON
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileServerOverridesForm;
