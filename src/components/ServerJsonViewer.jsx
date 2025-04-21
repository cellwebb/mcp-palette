import React, { useEffect } from "react";
import JsonEditor from "./JsonEditor";
import { filterInternalFields } from "../utils/helpers";

const ServerJsonViewer = ({ server, serverId, onBack }) => {
  // Format server object for JSON display - filter out internal fields
  let serverJson = filterInternalFields(server);

  // Format as an MCP compliant JSON structure
  const mcpJson = {
    [server.name || serverId]: {
      command: serverJson.command,
      args: serverJson.args,
    },
  };

  // Add environment variables if they exist
  if (serverJson.env && Object.keys(serverJson.env).length > 0) {
    mcpJson[server.name || serverId].env = serverJson.env;
  }

  // Automatically focus on the JSON content when the component mounts
  useEffect(() => {
    // Set page title to indicate JSON view mode
    const originalTitle = document.title;
    document.title = `MCP Palette - JSON: ${server.name}`;

    return () => {
      document.title = originalTitle;
    };
  }, [server.name]);

  return (
    <div className="server-json-viewer">
      <div className="server-json-header">
        <h2>
          MCP Configuration JSON: {server.name}{" "}
          <span className="readonly-badge">🔒 Read-Only</span>
        </h2>
        <div className="server-json-actions">
          <button className="button button-secondary" onClick={onBack}>
            Back to Form
          </button>
        </div>
      </div>

      <JsonEditor json={JSON.stringify(mcpJson, null, 2)} readOnly={true} />
    </div>
  );
};

export default ServerJsonViewer;
