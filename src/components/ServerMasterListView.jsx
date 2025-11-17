import ServerMasterList from './ServerMasterList';
import MasterServerForm from './MasterServerForm';
import JsonEditor from './JsonEditor';
import {
  formatSingleServerConfig,
  formatServerListToMcpJson,
} from '../utils/validation/mcpValidator';
import { getServerDisplayName } from '../utils/profileUtils';

const ServerMasterListView = ({
  // Server state
  serverMasterList,
  selectedServerMaster,
  isAddingServer,
  viewingServerJson,
  profiles,

  // Edit mode
  editMode,
  setEditMode,

  // Handlers
  onSelectServer,
  onAddMasterServer,
  onSaveMasterServer,
  onUpdateMasterServer,
  onDeleteMasterServer,
  onViewServerJson,
  onCancelServerForm,
  onBackFromJson,
}) => {
  return (
    <>
      <div className="tabs">
        <div
          className={`tab ${editMode === 'form' ? 'active' : ''}`}
          onClick={() => setEditMode('form')}
        >
          Form View
        </div>
        <div
          className={`tab ${editMode === 'json' ? 'active' : ''}`}
          onClick={() => setEditMode('json')}
        >
          JSON View
        </div>
      </div>

      {editMode === 'form' ? (
        <>
          {viewingServerJson && selectedServerMaster ? (
            // View individual server JSON
            <div className="server-json-viewer">
              <div
                className="server-json-actions"
                style={{ textAlign: 'right', marginBottom: '15px' }}
              >
                <button className="button button-secondary" onClick={onBackFromJson}>
                  Back to Form
                </button>
              </div>

              <JsonEditor
                json={JSON.stringify(
                  {
                    [getServerDisplayName(serverMasterList[selectedServerMaster])]:
                      formatSingleServerConfig(serverMasterList[selectedServerMaster]),
                  },
                  null,
                  2
                )}
                readOnly={true}
                isProfileView={false}
                serverName={getServerDisplayName(serverMasterList[selectedServerMaster])}
              />
            </div>
          ) : isAddingServer || selectedServerMaster ? (
            <MasterServerForm
              server={selectedServerMaster ? serverMasterList[selectedServerMaster] : null}
              serverId={selectedServerMaster}
              onSave={selectedServerMaster ? onUpdateMasterServer : onSaveMasterServer}
              onCancel={onCancelServerForm}
            />
          ) : (
            <ServerMasterList
              servers={serverMasterList}
              profiles={profiles}
              selectedServer={selectedServerMaster}
              onSelectServer={onSelectServer}
              onAddServer={onAddMasterServer}
              onDeleteServer={onDeleteMasterServer}
              onViewServerJson={onViewServerJson}
            />
          )}
        </>
      ) : (
        <JsonEditor
          json={JSON.stringify(formatServerListToMcpJson(serverMasterList), null, 2)}
          readOnly={true}
          isProfileView={false}
        />
      )}
    </>
  );
};

export default ServerMasterListView;
