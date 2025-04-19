import React from "react";
import JsonEditor from "./JsonEditor";

const ServerJsonViewer = ({ server, serverId, onBack }) => {
  // Format server object for JSON display
  const serverJson = {
    id: serverId,
    ...server,
  };

  return (
    <div className="server-json-viewer">
      <div className="server-json-header">
        <h2>Server JSON: {server.name}</h2>
        <button className="button button-secondary" onClick={onBack}>
          Back to Form
        </button>
      </div>

      <JsonEditor json={JSON.stringify(serverJson, null, 2)} readOnly={true} />
    </div>
  );
};

export default ServerJsonViewer;
