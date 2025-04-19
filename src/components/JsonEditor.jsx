import { useState, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

const JsonEditor = ({ json, onSave }) => {
  const [editorContent, setEditorContent] = useState(json);
  const [error, setError] = useState(null);

  // Update content when json prop changes
  useEffect(() => {
    setEditorContent(json);
  }, [json]);

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

  // Monaco editor options
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: "line",
    automaticLayout: true,
  };

  // Fallback if Monaco editor can't be loaded
  const renderFallbackEditor = () => (
    <textarea
      className="json-editor-container"
      value={editorContent}
      onChange={(e) => {
        setEditorContent(e.target.value);
        validateJson(e.target.value);
      }}
      style={{
        fontFamily: "monospace",
        fontSize: "14px",
        padding: "10px",
        resize: "vertical",
        width: "100%",
        height: "400px",
      }}
    />
  );

  return (
    <div className="json-editor">
      <div className="json-editor-header">
        <h2>Edit JSON Configuration</h2>
        <div className="json-editor-actions">
          <button className="button button-secondary" onClick={handleFormat}>
            Format
          </button>
          <button
            className="button button-primary"
            onClick={handleSave}
            disabled={!!error}
          >
            Save
          </button>
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
            height="400"
            language="json"
            theme="vs-light"
            value={editorContent}
            options={editorOptions}
            onChange={(value) => {
              setEditorContent(value);
              validateJson(value);
            }}
          />
        ) : (
          renderFallbackEditor()
        )}
      </div>
    </div>
  );
};

export default JsonEditor;
