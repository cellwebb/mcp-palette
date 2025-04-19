import { useState, useEffect } from "react";

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

  const [newArg, setNewArg] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Initialize form data when inputs change
  useEffect(() => {
    if (masterServer && profileServer) {
      // Start with master values
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
              newEnv[key] = value;
            },
          );

          setFormData((prev) => ({ ...prev, env: newEnv }));

          const envOverrides = {};
          Object.keys(profileServer.overrides.env).forEach((key) => {
            envOverrides[key] = true;
          });
          setOverrideFields((prev) => ({ ...prev, env: envOverrides }));
        }
      }
    } else if (masterServer) {
      // Just use master values
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
    }
  }, [masterServer, profileServer]);

  // Toggle field override status
  const toggleOverride = (field) => {
    setOverrideFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));

    // Reset to master value if turning off override
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

    // Reset to master value if turning off override
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
    setFormData((prev) => {
      const { [key]: removed, ...restEnv } = prev.env;
      return {
        ...prev,
        env: restEnv,
      };
    });

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
    Object.entries(overrideFields.env).forEach(([key, isOverridden]) => {
      if (isOverridden && formData.env[key] !== undefined) {
        envOverrides[key] = formData.env[key];
      }
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
      <h2>Customize Server for {profileName}</h2>
      <p>Override specific settings from the Server Master List.</p>

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
                Using master value: <strong>{masterServer.name}</strong>
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
                Using master value: <strong>{masterServer.command}</strong>
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
                Using master values:{" "}
                <strong>{(masterServer.args || []).join(" ")}</strong>
              </div>
            )}
          </div>
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
                Add
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
        </div>
      </form>
    </div>
  );
};

export default ProfileServerOverridesForm;
