import { renderHook, act, waitFor } from '@testing-library/react';
import { useServerMasterList } from '../useServerMasterList';

// Mock window.api
const mockApi = {
  addMasterServer: jest.fn(),
  updateMasterServer: jest.fn(),
  deleteMasterServer: jest.fn(),
  safeAlert: jest.fn(),
};

describe('useServerMasterList', () => {
  beforeEach(() => {
    window.api = mockApi;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete window.api;
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useServerMasterList());

    expect(result.current.serverMasterList).toEqual({});
    expect(result.current.selectedServerMaster).toBeNull();
    expect(result.current.isAddingServer).toBe(false);
    expect(result.current.viewingServerJson).toBe(false);
  });

  test('handleAddMasterServer sets up state for adding a new server', () => {
    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.handleAddMasterServer();
    });

    expect(result.current.selectedServerMaster).toBeNull();
    expect(result.current.isAddingServer).toBe(true);
  });

  test('handleSaveMasterServer adds a server successfully', async () => {
    const newServer = { name: 'test-server', command: 'node' };
    const updatedMasterList = { 'server-1': newServer };
    mockApi.addMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    await act(async () => {
      await result.current.handleSaveMasterServer(newServer);
    });

    expect(mockApi.addMasterServer).toHaveBeenCalledWith(newServer);
    expect(result.current.serverMasterList).toEqual(updatedMasterList);
    expect(result.current.isAddingServer).toBe(false);
    expect(result.current.selectedServerMaster).toBeNull();
    expect(mockApi.safeAlert).toHaveBeenCalledWith(
      'Server "test-server" added to Master List successfully!'
    );
  });

  test('handleSaveMasterServer handles errors', async () => {
    const newServer = { name: 'test-server', command: 'node' };
    const error = new Error('Failed to save');
    mockApi.addMasterServer.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useServerMasterList());

    await act(async () => {
      await result.current.handleSaveMasterServer(newServer);
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to save server: Failed to save');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save server:', error);
    consoleSpy.mockRestore();
  });

  test('handleUpdateMasterServer updates a server successfully', async () => {
    const serverId = 'server-1';
    const updatedServer = { name: 'updated-server', command: 'bun' };
    const updatedMasterList = { 'server-1': updatedServer };
    mockApi.updateMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    // Set initial state
    act(() => {
      result.current.setSelectedServerMaster(serverId);
      result.current.setIsAddingServer(true);
    });

    await act(async () => {
      await result.current.handleUpdateMasterServer(serverId, updatedServer);
    });

    expect(mockApi.updateMasterServer).toHaveBeenCalledWith(serverId, updatedServer);
    expect(result.current.serverMasterList).toEqual(updatedMasterList);
    expect(result.current.selectedServerMaster).toBeNull();
    expect(result.current.isAddingServer).toBe(false);
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Server "updated-server" updated successfully!');
  });

  test('handleUpdateMasterServer handles errors', async () => {
    const serverId = 'server-1';
    const updatedServer = { name: 'updated-server', command: 'bun' };
    const error = new Error('Update failed');
    mockApi.updateMasterServer.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useServerMasterList());

    await act(async () => {
      await result.current.handleUpdateMasterServer(serverId, updatedServer);
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to update server: Update failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to update server:', error);
    consoleSpy.mockRestore();
  });

  test('handleDeleteMasterServer deletes a server successfully', async () => {
    const serverId = 'server-1';
    const updatedMasterList = {};
    mockApi.deleteMasterServer.mockResolvedValue(updatedMasterList);

    const { result } = renderHook(() => useServerMasterList());

    // Set initial state
    act(() => {
      result.current.setSelectedServerMaster(serverId);
      result.current.setServerMasterList({ 'server-1': { name: 'test' } });
    });

    await act(async () => {
      await result.current.handleDeleteMasterServer(serverId);
    });

    expect(mockApi.deleteMasterServer).toHaveBeenCalledWith(serverId);
    expect(result.current.serverMasterList).toEqual(updatedMasterList);
    expect(result.current.selectedServerMaster).toBeNull();
  });

  test('handleDeleteMasterServer handles errors and throws', async () => {
    const serverId = 'server-1';
    const error = new Error('Delete failed');
    mockApi.deleteMasterServer.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useServerMasterList());

    await expect(
      act(async () => {
        await result.current.handleDeleteMasterServer(serverId);
      })
    ).rejects.toThrow('Delete failed');

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to delete server: Delete failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete server:', error);
    consoleSpy.mockRestore();
  });

  test('handleRestoreServerDefaults restores filesystem server defaults', async () => {
    const serverId = 'server-1';
    const serverConfig = { name: 'filesystem', originalId: 'filesystem' };
    const updatedMasterList = {
      'server-1': {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { BASE_DIRS: '~/Documents,~/Downloads' },
        originalId: 'filesystem',
      },
    };
    mockApi.updateMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    // Set initial state
    act(() => {
      result.current.setServerMasterList({ 'server-1': serverConfig });
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.updateMasterServer).toHaveBeenCalledWith(serverId, {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      env: { BASE_DIRS: '~/Documents,~/Downloads' },
      originalId: 'filesystem',
    });
    expect(result.current.serverMasterList).toEqual(updatedMasterList);
    expect(mockApi.safeAlert).toHaveBeenCalledWith(
      'Server "filesystem" restored to default configuration.'
    );
  });

  test('handleRestoreServerDefaults restores memory server defaults', async () => {
    const serverId = 'server-2';
    const serverConfig = { name: 'memory', originalId: 'memory' };
    const updatedMasterList = { 'server-2': { name: 'memory' } };
    mockApi.updateMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setServerMasterList({ 'server-2': serverConfig });
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.updateMasterServer).toHaveBeenCalledWith(serverId, {
      name: 'memory',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      env: { MEMORY_FILE_PATH: '~/.mcp-memory.json' },
      originalId: 'memory',
    });
  });

  test('handleRestoreServerDefaults restores puppeteer server defaults', async () => {
    const serverId = 'server-3';
    const serverConfig = { name: 'puppeteer', originalId: 'puppeteer' };
    const updatedMasterList = { 'server-3': { name: 'puppeteer' } };
    mockApi.updateMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setServerMasterList({ 'server-3': serverConfig });
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.updateMasterServer).toHaveBeenCalledWith(serverId, {
      name: 'puppeteer',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      env: {
        HEADLESS: 'true',
        USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      originalId: 'puppeteer',
    });
  });

  test('handleRestoreServerDefaults uses fallback for unknown server type', async () => {
    const serverId = 'server-4';
    const serverConfig = { name: 'custom-server', originalId: 'custom-server' };
    const updatedMasterList = { 'server-4': { name: 'custom-server' } };
    mockApi.updateMasterServer.mockResolvedValue(updatedMasterList);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setServerMasterList({ 'server-4': serverConfig });
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.updateMasterServer).toHaveBeenCalledWith(serverId, {
      name: 'custom-server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-custom-server'],
      env: {},
      originalId: 'custom-server',
    });
  });

  test('handleRestoreServerDefaults handles missing server config', async () => {
    const serverId = 'non-existent';
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setServerMasterList({});
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Server with ID non-existent not found.');
    expect(mockApi.updateMasterServer).not.toHaveBeenCalled();
  });

  test('handleRestoreServerDefaults handles errors', async () => {
    const serverId = 'server-1';
    const serverConfig = { name: 'filesystem', originalId: 'filesystem' };
    const error = new Error('Restore failed');
    mockApi.updateMasterServer.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setServerMasterList({ 'server-1': serverConfig });
    });

    await act(async () => {
      await result.current.handleRestoreServerDefaults(serverId);
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to restore defaults: Restore failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to restore server defaults:', error);
    consoleSpy.mockRestore();
  });

  test('setServerMasterList updates state', () => {
    const { result } = renderHook(() => useServerMasterList());

    const newList = { 'server-1': { name: 'test' } };

    act(() => {
      result.current.setServerMasterList(newList);
    });

    expect(result.current.serverMasterList).toEqual(newList);
  });

  test('setSelectedServerMaster updates state', () => {
    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setSelectedServerMaster('server-1');
    });

    expect(result.current.selectedServerMaster).toBe('server-1');
  });

  test('setIsAddingServer updates state', () => {
    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setIsAddingServer(true);
    });

    expect(result.current.isAddingServer).toBe(true);
  });

  test('setViewingServerJson updates state', () => {
    const { result } = renderHook(() => useServerMasterList());

    act(() => {
      result.current.setViewingServerJson(true);
    });

    expect(result.current.viewingServerJson).toBe(true);
  });
});
