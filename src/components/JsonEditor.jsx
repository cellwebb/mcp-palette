import { useState, useEffect, useRef } from "react";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor";

const JsonEditor = ({
  json,
  onViewServerJson,
  onRestoreDefaults,
  isProfileView = true,
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
      const jsonToCopy = JSON.stringify(JSON.parse(editorContent), null, 2);
      navigator.clipboard.writeText(jsonToCopy);
      setCopySuccess(true);
    } catch (err) {
      setError("Failed to copy: Invalid JSON format");
    }
  };

  // Handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    // Add keyboard shortcut for copying JSON (Ctrl+Shift+C)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_C,
      () => {
        handleCopyToClipboard();
      },
    );
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
            MCP Configuration JSON{" "}
            <span className="readonly-badge">🔒 Read-Only</span>
          </h2>
          <p className="json-editor-subtitle">
            {isProfileView ? (
              <>
                This view displays the effective configuration with only enabled
                servers, showing values inherited from the master list with
                profile-specific overrides applied. You can copy this JSON but
                not edit it directly.
              </>
            ) : (
              <>
                This view displays the complete server master list containing
                all available server configurations. You can copy this JSON but
                not edit it directly.
              </>
            )}
          </p>
        </div>
        <div className="json-editor-actions">
          <div className="json-editor-actions-container">
            <button
              className="button button-info"
              onClick={handleCopyToClipboard}
              title="Copy JSON to clipboard (Ctrl+Shift+C)"
            >
              Copy to Clipboard (Ctrl+Shift+C)
            </button>

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
