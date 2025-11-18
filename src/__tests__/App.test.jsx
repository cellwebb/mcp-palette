import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the custom hooks
jest.mock('../hooks/useProfiles', () => ({
  useProfiles: jest.fn(),
}));

jest.mock('../hooks/useServerMasterList', () => ({
  useServerMasterList: jest.fn(),
}));

jest.mock('../hooks/useAppState', () => ({
  useAppState: jest.fn(),
}));

// Mock child components
jest.mock('../components/ProfileSelector', () => {
  return function MockProfileSelector() {
    return <div data-testid="profile-selector">ProfileSelector</div>;
  };
});

jest.mock('../components/ProfilesView', () => {
  return function MockProfilesView() {
    return <div data-testid="profiles-view">ProfilesView</div>;
  };
});

jest.mock('../components/ServerMasterListView', () => {
  return function MockServerMasterListView() {
    return <div data-testid="server-master-list-view">ServerMasterListView</div>;
  };
});

jest.mock('../components/ServerSelectionModal', () => {
  return function MockServerSelectionModal({ show }) {
    return show ? <div data-testid="server-selection-modal">ServerSelectionModal</div> : null;
  };
});

jest.mock('../components/SimpleRenameModal', () => {
  return function MockSimpleRenameModal({ isOpen }) {
    return isOpen ? <div data-testid="simple-rename-modal">SimpleRenameModal</div> : null;
  };
});

describe('App', () => {
  const mockUseProfiles = require('../hooks/useProfiles').useProfiles;
  const mockUseServerMasterList = require('../hooks/useServerMasterList').useServerMasterList;
  const mockUseAppState = require('../hooks/useAppState').useAppState;

  const mockProfilesHook = {
    profiles: [{ id: '1', name: 'Profile 1', servers: {} }],
    setProfiles: jest.fn(),
    activeProfile: 'Profile 1',
    setActiveProfile: jest.fn(),
    currentProfile: { id: '1', name: 'Profile 1', servers: {} },
    isAddingProfile: false,
    setIsAddingProfile: jest.fn(),
    showRenameModal: false,
    setShowRenameModal: jest.fn(),
    selectedProfileServer: null,
    setSelectedProfileServer: jest.fn(),
    isEditingOverrides: false,
    setIsEditingOverrides: jest.fn(),
    showServerSelectionModal: false,
    setShowServerSelectionModal: jest.fn(),
    handleProfileSelect: jest.fn(),
    handleAddProfile: jest.fn(),
    handleRenameProfile: jest.fn(),
    handleDeleteProfile: jest.fn(),
    handleToggleProfileServer: jest.fn(),
    handleAddServerToProfile: jest.fn(),
    handleEditOverrides: jest.fn(),
    handleRemoveServerFromProfile: jest.fn(),
    handleSaveOverrides: jest.fn(),
    handleRestoreProfileServerDefaults: jest.fn(),
  };

  const mockServerMasterListHook = {
    serverMasterList: { 'server-1': { name: 'Server 1', command: 'node' } },
    setServerMasterList: jest.fn(),
    selectedServerMaster: null,
    setSelectedServerMaster: jest.fn(),
    isAddingServer: false,
    setIsAddingServer: jest.fn(),
    viewingServerJson: false,
    setViewingServerJson: jest.fn(),
    handleAddMasterServer: jest.fn(),
    handleSaveMasterServer: jest.fn(),
    handleUpdateMasterServer: jest.fn(),
    handleDeleteMasterServer: jest.fn(),
    handleRestoreServerDefaults: jest.fn(),
  };

  const mockAppStateHook = {
    activePage: 'profiles',
    setActivePage: jest.fn(),
    editMode: 'form',
    setEditMode: jest.fn(),
  };

  const mockApi = {
    getServerMasterList: jest.fn(),
    getProfiles: jest.fn(),
    getActiveProfile: jest.fn(),
    onProfilesUpdated: jest.fn(),
    onProfilesReset: jest.fn(),
    onMenuImportConfig: jest.fn(),
    onMenuExportConfig: jest.fn(),
    removeAllListeners: jest.fn(),
    importConfig: jest.fn(),
    exportConfig: jest.fn(),
    safeAlert: jest.fn(),
    updateProfile: jest.fn(),
    updateMasterServer: jest.fn(),
    getServerMasterList: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks first
    jest.clearAllMocks();

    // Set up window.api
    window.api = mockApi;
    mockUseProfiles.mockReturnValue(mockProfilesHook);
    mockUseServerMasterList.mockReturnValue(mockServerMasterListHook);
    mockUseAppState.mockReturnValue(mockAppStateHook);

    mockApi.getServerMasterList.mockResolvedValue({ 'server-1': { name: 'Server 1' } });
    mockApi.getProfiles.mockResolvedValue([{ id: '1', name: 'Profile 1', servers: {} }]);
    mockApi.getActiveProfile.mockResolvedValue('Profile 1');
    mockApi.safeAlert.mockResolvedValue();
  });

  afterEach(() => {
    // Don't delete window.api immediately - let React cleanup first
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete window.api;
  });

  test('renders app container', () => {
    render(<App />);
    expect(document.querySelector('.app-container')).toBeInTheDocument();
  });

  test('renders header with title and subtitle', () => {
    render(<App />);
    expect(screen.getByText('MCP Palette')).toBeInTheDocument();
    expect(screen.getByText('MCP Server Configuration Manager')).toBeInTheDocument();
  });

  test('renders tabs for Profiles and Server Master List', () => {
    render(<App />);
    expect(screen.getByText('Profiles')).toBeInTheDocument();
    expect(screen.getByText('Server Master List')).toBeInTheDocument();
  });

  test('Profiles tab is active when activePage is profiles', () => {
    render(<App />);
    const profilesTab = screen.getByText('Profiles').closest('.tab');
    expect(profilesTab).toHaveClass('active');
  });

  test('Server Master List tab is active when activePage is serverMasterList', () => {
    mockUseAppState.mockReturnValue({
      ...mockAppStateHook,
      activePage: 'serverMasterList',
    });

    render(<App />);
    const tabs = document.querySelectorAll('.tab');
    const serverTab = Array.from(tabs).find(tab => tab.textContent === 'Server Master List');
    expect(serverTab).toHaveClass('active');
  });

  test('clicking Profiles tab calls setActivePage', () => {
    render(<App />);
    const tabs = document.querySelectorAll('.tab');
    const profilesTab = Array.from(tabs).find(tab => tab.textContent === 'Profiles');
    profilesTab.click();
    expect(mockAppStateHook.setActivePage).toHaveBeenCalledWith('profiles');
  });

  test('clicking Server Master List tab calls setActivePage', () => {
    render(<App />);
    const tabs = document.querySelectorAll('.tab');
    const serverTab = Array.from(tabs).find(tab => tab.textContent === 'Server Master List');
    serverTab.click();
    expect(mockAppStateHook.setActivePage).toHaveBeenCalledWith('serverMasterList');
  });

  test('renders ProfileSelector in sidebar when on profiles page', () => {
    render(<App />);
    expect(screen.getByTestId('profile-selector')).toBeInTheDocument();
  });

  test('renders server master info in sidebar when on serverMasterList page', () => {
    mockUseAppState.mockReturnValue({
      ...mockAppStateHook,
      activePage: 'serverMasterList',
    });

    render(<App />);
    // Check for the heading specifically
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.querySelector('h2')).toHaveTextContent('Server Master List');
    expect(screen.getByText(/The Server Master List contains all available MCP servers/)).toBeInTheDocument();
  });

  test('renders Add New Server button in sidebar on serverMasterList page', () => {
    mockUseAppState.mockReturnValue({
      ...mockAppStateHook,
      activePage: 'serverMasterList',
    });

    render(<App />);
    expect(screen.getByText('Add New Server')).toBeInTheDocument();
  });

  test('clicking Add New Server button calls handleAddMasterServer', () => {
    mockUseAppState.mockReturnValue({
      ...mockAppStateHook,
      activePage: 'serverMasterList',
    });

    render(<App />);
    const addButton = screen.getByText('Add New Server');
    addButton.click();
    expect(mockServerMasterListHook.handleAddMasterServer).toHaveBeenCalled();
  });

  test('renders ProfilesView when on profiles page', () => {
    render(<App />);
    expect(screen.getByTestId('profiles-view')).toBeInTheDocument();
  });

  test('renders ServerMasterListView when on serverMasterList page', () => {
    mockUseAppState.mockReturnValue({
      ...mockAppStateHook,
      activePage: 'serverMasterList',
    });

    render(<App />);
    expect(screen.getByTestId('server-master-list-view')).toBeInTheDocument();
  });

  test('does not render ServerSelectionModal when showServerSelectionModal is false', () => {
    render(<App />);
    expect(screen.queryByTestId('server-selection-modal')).not.toBeInTheDocument();
  });

  test('renders ServerSelectionModal when showServerSelectionModal is true', () => {
    mockUseProfiles.mockReturnValue({
      ...mockProfilesHook,
      showServerSelectionModal: true,
    });

    render(<App />);
    expect(screen.getByTestId('server-selection-modal')).toBeInTheDocument();
  });

  test('does not render SimpleRenameModal when showRenameModal is false', () => {
    render(<App />);
    expect(screen.queryByTestId('simple-rename-modal')).not.toBeInTheDocument();
  });

  test('renders SimpleRenameModal when showRenameModal is true', () => {
    mockUseProfiles.mockReturnValue({
      ...mockProfilesHook,
      showRenameModal: true,
    });

    render(<App />);
    expect(screen.getByTestId('simple-rename-modal')).toBeInTheDocument();
  });

  test('loads data on initial render', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockApi.getServerMasterList).toHaveBeenCalled();
      expect(mockApi.getProfiles).toHaveBeenCalled();
      expect(mockApi.getActiveProfile).toHaveBeenCalled();
    });

    expect(mockServerMasterListHook.setServerMasterList).toHaveBeenCalledWith({ 'server-1': { name: 'Server 1' } });
    expect(mockProfilesHook.setProfiles).toHaveBeenCalledWith([{ id: '1', name: 'Profile 1', servers: {} }]);
    expect(mockProfilesHook.setActiveProfile).toHaveBeenCalledWith('Profile 1');
  });

  test('handles error when loading data fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getServerMasterList.mockRejectedValue(new Error('Load failed'));

    render(<App />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('sets up event listeners on mount', async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockApi.onProfilesUpdated).toHaveBeenCalled();
      expect(mockApi.onProfilesReset).toHaveBeenCalled();
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
      expect(mockApi.onMenuExportConfig).toHaveBeenCalled();
    });
  });

  test('cleans up event listeners on unmount', async () => {
    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(mockApi.onProfilesUpdated).toHaveBeenCalled();
    });

    unmount();

    expect(mockApi.removeAllListeners).toHaveBeenCalled();
  });

  test('handleImportConfig imports configuration successfully', async () => {
    const importResult = {
      serverMasterList: { 'server-2': { name: 'Server 2' } },
      profiles: [{ id: '2', name: 'Profile 2', servers: {} }],
    };
    mockApi.importConfig.mockResolvedValue(importResult);

    render(<App />);

    // Get the callback passed to onMenuImportConfig
    await waitFor(() => {
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
    });

    const importCallback = mockApi.onMenuImportConfig.mock.calls[0][0];
    await importCallback();

    expect(mockApi.importConfig).toHaveBeenCalled();
    expect(mockServerMasterListHook.setServerMasterList).toHaveBeenCalledWith(importResult.serverMasterList);
    expect(mockProfilesHook.setProfiles).toHaveBeenCalledWith(importResult.profiles);
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Configuration imported successfully!');
  });

  test('handleImportConfig handles import with only serverMasterList', async () => {
    const importResult = {
      serverMasterList: { 'server-2': { name: 'Server 2' } },
    };
    mockApi.importConfig.mockResolvedValue(importResult);

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
    });

    // Clear the initial load calls
    mockServerMasterListHook.setServerMasterList.mockClear();
    mockProfilesHook.setProfiles.mockClear();

    const importCallback = mockApi.onMenuImportConfig.mock.calls[0][0];
    await importCallback();

    expect(mockServerMasterListHook.setServerMasterList).toHaveBeenCalledWith(importResult.serverMasterList);
    expect(mockProfilesHook.setProfiles).not.toHaveBeenCalled();
  });

  test('handleImportConfig handles import with only profiles', async () => {
    const importResult = {
      profiles: [{ id: '2', name: 'Profile 2', servers: {} }],
    };
    mockApi.importConfig.mockResolvedValue(importResult);

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
    });

    // Clear the initial load calls
    mockServerMasterListHook.setServerMasterList.mockClear();
    mockProfilesHook.setProfiles.mockClear();

    const importCallback = mockApi.onMenuImportConfig.mock.calls[0][0];
    await importCallback();

    expect(mockProfilesHook.setProfiles).toHaveBeenCalledWith(importResult.profiles);
    expect(mockServerMasterListHook.setServerMasterList).not.toHaveBeenCalled();
  });

  test('handleImportConfig handles null result', async () => {
    mockApi.importConfig.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
    });

    const importCallback = mockApi.onMenuImportConfig.mock.calls[0][0];
    await importCallback();

    expect(mockApi.safeAlert).not.toHaveBeenCalled();
  });

  test('handleImportConfig handles error', async () => {
    const error = new Error('Import failed');
    mockApi.importConfig.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuImportConfig).toHaveBeenCalled();
    });

    const importCallback = mockApi.onMenuImportConfig.mock.calls[0][0];
    await importCallback();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to import configuration:', error);
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Import failed: Import failed');

    consoleSpy.mockRestore();
  });

  test('handleExportConfig exports configuration successfully', async () => {
    mockApi.exportConfig.mockResolvedValue(true);

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuExportConfig).toHaveBeenCalled();
    });

    const exportCallback = mockApi.onMenuExportConfig.mock.calls[0][0];
    await exportCallback();

    expect(mockApi.exportConfig).toHaveBeenCalled();
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Configuration exported successfully!');
  });

  test('handleExportConfig does not show alert when export returns false', async () => {
    mockApi.exportConfig.mockResolvedValue(false);

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuExportConfig).toHaveBeenCalled();
    });

    const exportCallback = mockApi.onMenuExportConfig.mock.calls[0][0];
    await exportCallback();

    expect(mockApi.safeAlert).not.toHaveBeenCalled();
  });

  test('handleExportConfig handles error', async () => {
    const error = new Error('Export failed');
    mockApi.exportConfig.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(mockApi.onMenuExportConfig).toHaveBeenCalled();
    });

    const exportCallback = mockApi.onMenuExportConfig.mock.calls[0][0];
    await exportCallback();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to export configuration:', error);
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Export failed: Export failed');

    consoleSpy.mockRestore();
  });

  test('does not set up event listeners when window.api methods are not available', async () => {
    // Create a copy of mockApi without onProfilesUpdated
    const apiWithoutListeners = { ...mockApi };
    delete apiWithoutListeners.onProfilesUpdated;
    window.api = apiWithoutListeners;

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(mockApi.getServerMasterList).toHaveBeenCalled();
    });

    // Should not crash
    unmount();

    // removeAllListeners should not have been called since event listeners weren't set up
    expect(mockApi.removeAllListeners).not.toHaveBeenCalled();
  });

  test('renders main content structure', () => {
    const { container } = render(<App />);

    expect(container.querySelector('.main-content')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.main-panel')).toBeInTheDocument();
  });
});
