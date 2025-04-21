import { useEffect, useRef, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import { validateMcpConfig } from "../utils/validation/mcpValidator";

const JsonEditor = ({
  json,
  onViewServerJson,
  onRestoreDefaults,
  isProfileView = true,
  profileName = "",
  serverName = "",
  hideTitle = false,
}) => {
  const [editorContent, setEditorContent] = useState(json);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    valid: true,
    errors: [],
  });
  const editorRef = useRef(null);

  // Update content when json prop changes
  useEffect(() => {
    setEditorContent(json);
    validateMcpFormat(json);
  }, [json]);

  // Clear copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Validate MCP format
  const validateMcpFormat = (jsonContent) => {
    try {
      const parsed = JSON.parse(jsonContent);
      const validationResult = validateMcpConfig(parsed);
      setValidationStatus(validationResult);
    } catch (err) {
      setValidationStatus({
        valid: false,
        errors: ["Invalid JSON format: " + err.message],
      });
    }
  };

  // Validate JSON content
  const validateJson = (content) => {
    try {
      JSON.parse(content);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Copy JSON to clipboard
  const handleCopyToClipboard = () => {
    try {
      // Format JSON properly for copying
      let jsonData = JSON.parse(editorContent);

      // Special handling for profile view to format as MCP config
      if (isProfileView && jsonData) {
        // Ensure we're using the correct format for MCP
        if (!jsonData.mcpServers && jsonData.servers) {
          // Convert legacy format to MCP format
          const mcpServers = {};
          Object.entries(jsonData.servers || {}).forEach(([id, server]) => {
            const serverName = server.name || id;
            mcpServers[serverName] = {
              command: server.command,
              args: server.args,
            };

            if (server.env && Object.keys(server.env).length > 0) {
              mcpServers[serverName].env = server.env;
            }
          });

          jsonData = { mcpServers };
        }
      }

      const jsonToCopy = JSON.stringify(jsonData, null, 2);
      navigator.clipboard.writeText(jsonToCopy);
      setCopySuccess(true);
    } catch (err) {
      setError("Failed to copy: Invalid JSON format");
    }
  };

  // Export JSON to file
  const handleExportToJson = () => {
    try {
      let jsonData = JSON.parse(editorContent);

      // Special handling for profile view to format as MCP config
      if (isProfileView && jsonData) {
        // Ensure we're using the correct format for MCP
        if (!jsonData.mcpServers && jsonData.servers) {
          // Convert legacy format to MCP format
          const mcpServers = {};
          Object.entries(jsonData.servers || {}).forEach(([id, server]) => {
            const serverName = server.name || id;
            mcpServers[serverName] = {
              command: server.command,
              args: server.args,
            };

            if (server.env && Object.keys(server.env).length > 0) {
              mcpServers[serverName].env = server.env;
            }
          });

          jsonData = { mcpServers };
        }
      }

      const jsonToExport = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonToExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = isProfileView
        ? "mcp-config.json"
        : "server-master-list.json";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export: Invalid JSON format");
    }
  };

  // Handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Monaco editor options
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: true, // Always read-only for executable config
    cursorStyle: "line",
    automaticLayout: true,
    lineNumbers: "on",
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    fontSize: 14,
    fontFamily: "monospace",
  };

  // Fallback if Monaco editor can't be loaded
  const renderFallbackEditor = () => (
    <textarea
      className="json-editor-container"
      value={editorContent}
      readOnly={true}
      style={{
        fontFamily: "monospace",
        fontSize: "14px",
        padding: "10px",
        resize: "none",
        width: "100%",
        height: "100%",
        minHeight: "600px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    />
  );

  return (
    <div className="json-editor">
      <div className="json-editor-header">
        {!hideTitle && (
        <div className="json-editor-title">
          <h2>
            {isProfileView && profileName
              ? `MCP Configuration JSON - Profile: ${profileName}`
              : serverName && profileName
                ? `MCP Configuration JSON - Server: ${serverName} (Profile: ${profileName})`
                : serverName
                  ? `MCP Configuration JSON - Server: ${serverName}`
                  : "MCP Configuration JSON - All Servers"}{" "}
            <span className="readonly-badge">🔒 Read-Only</span>
            {validationStatus.valid ? (
              <span className="validation-badge validation-success">
                ✔ MCP Compliant
              </span>
            ) : (
              <span className="validation-badge validation-error">
                ✘ Not MCP Compliant
              </span>
            )}
          </h2>
          <p className="json-editor-subtitle">
            {isProfileView ? (
              <>
                This view displays the effective MCP-compliant configuration
                with only enabled servers, showing values inherited from the
                master list with profile-specific overrides applied.
              </>
            ) : serverName ? (
              <>
                This view displays the selected server configuration in
                MCP-compliant format.
              </>
            ) : (
              <>
                This view displays the complete server master list containing
                all available server configurations in MCP-compliant format.
              </>
            )}
          </p>
        </div>
        )}
        <div className="json-editor-actions">
          <div className="json-editor-actions-container">
            <div
              className="json-editor-action-buttons"
              style={{ display: "flex", gap: 8 }}
            >
              <button
                className="button button-info"
                onClick={handleCopyToClipboard}
                title="Copy JSON to clipboard"
              >
                Copy to Clipboard
              </button>
              {!serverName && (
                <button
                  className="button button-secondary"
                  onClick={handleExportToJson}
                  title="Export JSON as file"
                >
                  Export JSON
                </button>
              )}
            </div>

            {copySuccess && (
              <div className="copy-success-container">
                <span className="copy-success">Copied to clipboard!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="json-editor-error">
          <p>Error: {error}</p>
        </div>
      )}

      {!validationStatus.valid && validationStatus.errors.length > 0 && (
        <div className="json-editor-validation-errors">
          <h3>MCP Compliance Issues:</h3>
          <ul>
            {validationStatus.errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="json-editor-container">
        {/* Monaco editor with fallback */}
        {typeof window !== "undefined" ? (
          <MonacoEditor
            width="100%"
            height="100%"
            language="json"
            theme="vs-light"
            value={editorContent}
            options={editorOptions}
            onChange={(value) => {
              // No-op since it's read-only
            }}
            editorDidMount={handleEditorDidMount}
          />
        ) : (
          renderFallbackEditor()
        )}
      </div>
    </div>
  );
};

export default JsonEditor;
