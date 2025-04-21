import { useEffect, useRef, useState } from "react";
import MonacoEditor from "react-monaco-editor";

const JsonEditor = ({
  json,
  onViewServerJson,
  onRestoreDefaults,
  isProfileView = true,
  profileName = "",
}) => {
  const [editorContent, setEditorContent] = useState(json);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const editorRef = useRef(null);

  // Update content when json prop changes
  useEffect(() => {
    setEditorContent(json);
  }, [json]);

  // Clear copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

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
        <div className="json-editor-title">
          <h2>
            {isProfileView && profileName
              ? `MCP Configuration JSON - ${profileName}`
              : "MCP Configuration JSON - Server Master List"}{" "}
            <span className="readonly-badge">🔒 Read-Only</span>
          </h2>
          <p className="json-editor-subtitle">
            {isProfileView ? (
              <>
                This view displays the effective MCP-compliant configuration
                with only enabled servers, showing values inherited from the
                master list with profile-specific overrides applied.
              </>
            ) : (
              <>
                This view displays the complete server master list containing
                all available server configurations in MCP-compliant format.
              </>
            )}
          </p>
        </div>
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
              <button
                className="button button-secondary"
                onClick={handleExportToJson}
                title="Export JSON as file"
              >
                Export JSON
              </button>
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
