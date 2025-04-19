import { useState, useEffect, useRef } from "react";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor";

const JsonEditor = ({ json, onSave, readOnly = false }) => {
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

  // Handle save
  const handleSave = () => {
    if (validateJson(editorContent)) {
      onSave(editorContent);
    }
  };

  // Handle formatting
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(editorContent);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditorContent(formatted);
      setError(null);
    } catch (err) {
      setError(err.message);
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
    readOnly: readOnly,
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
      onChange={(e) => {
        if (!readOnly) {
          setEditorContent(e.target.value);
          validateJson(e.target.value);
        }
      }}
      readOnly={readOnly}
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
        <h2>{readOnly ? "JSON Configuration" : "Edit JSON Configuration"}</h2>
        <div className="json-editor-actions">
          <button
            className="button button-info"
            onClick={handleCopyToClipboard}
            title="Copy JSON to clipboard (Ctrl+Shift+C)"
          >
            Copy to Clipboard (Ctrl+Shift+C)
          </button>
          <button className="button button-secondary" onClick={handleFormat}>
            Format
          </button>
          {!readOnly && (
            <button
              className="button button-primary"
              onClick={handleSave}
              disabled={!!error}
            >
              Save
            </button>
          )}
          {copySuccess && (
            <span className="copy-success">Copied to clipboard!</span>
          )}
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
              if (!readOnly) {
                setEditorContent(value);
                validateJson(value);
              }
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
