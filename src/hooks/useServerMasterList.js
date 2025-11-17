import { useState } from 'react';
import { getServerDisplayName } from '../utils/profileUtils';

/**
 * Custom hook for managing the server master list
 */
export function useServerMasterList() {
  const [serverMasterList, setServerMasterList] = useState({});
  const [selectedServerMaster, setSelectedServerMaster] = useState(null);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [viewingServerJson, setViewingServerJson] = useState(false);

  /**
   * Handle adding a server to master list
   */
  const handleAddMasterServer = () => {
    setSelectedServerMaster(null);
    setIsAddingServer(true);
  };

  /**
   * Handle saving a server to master list
   */
  const handleSaveMasterServer = async (serverData) => {
    try {
      const updatedMasterList = await window.api.addMasterServer(serverData);

      setServerMasterList(updatedMasterList);
      setIsAddingServer(false);
      setSelectedServerMaster(null);

      // Show success message
      await window.api.safeAlert(
        `Server "${serverData.name}" added to Master List successfully!`
      );
    } catch (error) {
      console.error('Failed to save server:', error);
      await window.api.safeAlert('Failed to save server: ' + error.message);
    }
  };

  /**
   * Handle updating a server in master list
   */
  const handleUpdateMasterServer = async (serverId, updatedServer) => {
    try {
      const updatedMasterList = await window.api.updateMasterServer(serverId, updatedServer);
      setServerMasterList(updatedMasterList);

      // Reset state to return to the master list view
      setSelectedServerMaster(null);
      setIsAddingServer(false);

      // Show success message
      await window.api.safeAlert(`Server "${updatedServer.name}" updated successfully!`);
    } catch (error) {
      console.error('Failed to update server:', error);
      await window.api.safeAlert('Failed to update server: ' + error.message);
    }
  };

  /**
   * Handle deleting a server from master list
   */
  const handleDeleteMasterServer = async (serverId) => {
    try {
      const updatedMasterList = await window.api.deleteMasterServer(serverId);
      setServerMasterList(updatedMasterList);
      setSelectedServerMaster(null);

      return updatedMasterList;
    } catch (error) {
      console.error('Failed to delete server:', error);
      await window.api.safeAlert('Failed to delete server: ' + error.message);
      throw error;
    }
  };

  /**
   * Handle restoring server defaults
   */
  const handleRestoreServerDefaults = async (serverId) => {
    try {
      const serverConfig = serverMasterList[serverId];

      // If no server config is found, show error
      if (!serverConfig) {
        await window.api.safeAlert(`Server with ID ${serverId} not found.`);
        return;
      }

      // Get the original ID or name to determine server type
      const serverType = serverConfig.originalId || serverConfig.name || serverId;

      // Default configurations based on server type
      const defaultConfigs = {
        filesystem: {
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { BASE_DIRS: '~/Documents,~/Downloads' },
          originalId: 'filesystem',
        },
        memory: {
          name: 'memory',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
          env: { MEMORY_FILE_PATH: '~/.mcp-memory.json' },
          originalId: 'memory',
        },
        puppeteer: {
          name: 'puppeteer',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-puppeteer'],
          env: {
            HEADLESS: 'true',
            USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          originalId: 'puppeteer',
        },
      };

      // Try to determine server type from original ID or name
      const serverTypeKey = Object.keys(defaultConfigs).find(
        (key) => key === serverType || key === serverType.split('-')[0]
      );

      // Get default configuration for this server type or use fallback
      const defaultConfig = serverTypeKey
        ? defaultConfigs[serverTypeKey]
        : {
            name: serverConfig.name || 'unnamed-server',
            command: 'npx',
            args: ['-y', `@modelcontextprotocol/server-${serverType}`],
            env: {},
            originalId: serverConfig.originalId || serverType,
          };

      // Update the server with default configuration
      const updatedMasterList = await window.api.updateMasterServer(serverId, defaultConfig);
      setServerMasterList(updatedMasterList);

      await window.api.safeAlert(
        `Server "${getServerDisplayName(serverConfig)}" restored to default configuration.`
      );
    } catch (error) {
      console.error('Failed to restore server defaults:', error);
      await window.api.safeAlert(`Failed to restore defaults: ${error.message}`);
    }
  };

  return {
    // State
    serverMasterList,
    setServerMasterList,
    selectedServerMaster,
    setSelectedServerMaster,
    isAddingServer,
    setIsAddingServer,
    viewingServerJson,
    setViewingServerJson,

    // Handlers
    handleAddMasterServer,
    handleSaveMasterServer,
    handleUpdateMasterServer,
    handleDeleteMasterServer,
    handleRestoreServerDefaults,
  };
}
