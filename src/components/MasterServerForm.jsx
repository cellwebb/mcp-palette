import { useState, useEffect } from "react";

const MasterServerForm = ({ server, serverId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    command: "npx",
    args: [],
    env: {},
  });

  const [newArg, setNewArg] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Initialize form data when server changes
  useEffect(() => {
    if (server) {
      setFormData({
        id: serverId || server.id || "",
        name: server.name || "",
        command: server.command || "npx",
        args: server.args || [],
        env: server.env || {},
      });
    } else {
      // Default values for new server
      setFormData({
        id: "",
        name: "",
        command: "npx",
        args: [],
        env: {},
      });
    }
  }, [server, serverId]);

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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Make sure we have a server ID
    if (!formData.id && formData.name) {
      // Generate an ID from the name
      formData.id = formData.name.toLowerCase().replace(/\s+/g, "-");
    }

    onSave(formData);
  };

  return (
    <div className="form-container">
      <h2>
        {server ? "Edit Server in Master List" : "Add Server to Master List"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Settings</h3>

          <div className="form-row">
            <label htmlFor="id">Server ID</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="Unique identifier (e.g., 'filesystem', 'memory')"
              required
              readOnly={!!server} // Can't change ID of existing server
            />
          </div>

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
            />
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
                    <code>{key}</code>
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
        </div>
      </form>
    </div>
  );
};

export default MasterServerForm;
