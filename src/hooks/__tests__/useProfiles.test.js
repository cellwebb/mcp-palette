import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfiles } from '../useProfiles';
import * as profileUtils from '../../utils/profileUtils';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
  validate: jest.fn((str) => {
    // Simple UUID pattern match
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }),
}));

// Mock window.api
const mockApi = {
  setActiveProfile: jest.fn(),
  addProfile: jest.fn(),
  renameProfile: jest.fn(),
  deleteProfile: jest.fn(),
  updateProfile: jest.fn(),
  getActiveProfile: jest.fn(),
  safeAlert: jest.fn(),
  safeConfirm: jest.fn(),
};

describe('useProfiles', () => {
  beforeEach(() => {
    window.api = mockApi;
    window.alert = jest.fn();
    global.alert = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete window.api;
    delete window.alert;
    delete global.alert;
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useProfiles());

    expect(result.current.profiles).toEqual([]);
    expect(result.current.activeProfile).toBe('');
    expect(result.current.isAddingProfile).toBe(false);
    expect(result.current.showRenameModal).toBe(false);
    expect(result.current.selectedProfileServer).toBeNull();
    expect(result.current.isEditingOverrides).toBe(false);
    expect(result.current.showServerSelectionModal).toBe(false);
    expect(result.current.currentProfile).toEqual({});
  });

  test('currentProfile returns the active profile object', () => {
    const { result } = renderHook(() => useProfiles());

    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} },
    ];

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    expect(result.current.currentProfile).toEqual(profiles[0]);
  });

  test('handleProfileSelect sets active profile', async () => {
    mockApi.setActiveProfile.mockResolvedValue();
    const { result } = renderHook(() => useProfiles());

    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} },
    ];

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleProfileSelect('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(mockApi.setActiveProfile).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(result.current.activeProfile).toBe('Profile 1');
    expect(result.current.selectedProfileServer).toBeNull();
  });

  test('handleProfileSelect handles errors', async () => {
    const error = new Error('Failed to set active profile');
    mockApi.setActiveProfile.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    await act(async () => {
      await result.current.handleProfileSelect('1');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to set active profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleAddProfile adds a new profile successfully', async () => {
    const newProfile = { id: 'mock-uuid-123', name: 'New Profile', servers: {} };
    const updatedProfiles = [newProfile];
    mockApi.addProfile.mockResolvedValue(updatedProfiles);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.handleAddProfile('New Profile');
    });

    // Wait for the state update to complete
    await waitFor(() => {
      expect(result.current.profiles).toEqual(updatedProfiles);
    });

    expect(mockApi.addProfile).toHaveBeenCalledWith(newProfile);
    expect(result.current.isAddingProfile).toBe(false);
    consoleSpy.mockRestore();
  });

  test('handleAddProfile rejects empty profile names', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.handleAddProfile('');
    });

    expect(window.alert).toHaveBeenCalledWith('Profile name cannot be empty');
    expect(mockApi.addProfile).not.toHaveBeenCalled();

    act(() => {
      result.current.handleAddProfile('   ');
    });

    expect(window.alert).toHaveBeenCalledWith('Profile name cannot be empty');
  });

  test('handleAddProfile rejects duplicate profile names', () => {
    const { result } = renderHook(() => useProfiles());

    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Existing Profile', servers: {} }];

    act(() => {
      result.current.setProfiles(profiles);
    });

    result.current.handleAddProfile('Existing Profile');

    expect(global.alert).toHaveBeenCalledWith('A profile with the name "Existing Profile" already exists');
    expect(mockApi.addProfile).not.toHaveBeenCalled();
  });

  test('handleAddProfile handles case-insensitive duplicate check', () => {
    const { result } = renderHook(() => useProfiles());

    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Existing Profile', servers: {} }];

    act(() => {
      result.current.setProfiles(profiles);
    });

    result.current.handleAddProfile('EXISTING PROFILE');

    expect(global.alert).toHaveBeenCalledWith('A profile with the name "EXISTING PROFILE" already exists');
  });

  test('handleAddProfile handles errors', async () => {
    const error = new Error('Add failed');
    mockApi.addProfile.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.handleAddProfile('New Profile');
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error creating profile: Add failed');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to add profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleRenameProfile renames profile with object params', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Old Name', servers: {} }];
    const updatedProfiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'New Name', servers: {} }];
    mockApi.renameProfile.mockResolvedValue(updatedProfiles);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Old Name');
    });

    await act(async () => {
      await result.current.handleRenameProfile({ oldName: 'Old Name', newName: 'New Name' });
    });

    expect(mockApi.renameProfile).toHaveBeenCalledWith({ oldName: 'Old Name', newName: 'New Name' });
    expect(result.current.profiles).toEqual(updatedProfiles);
    expect(result.current.activeProfile).toBe('New Name');
    consoleSpy.mockRestore();
  });

  test('handleRenameProfile updates active profile when renamed', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Active Profile', servers: {} }];
    const updatedProfiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Renamed Profile', servers: {} }];
    mockApi.renameProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Active Profile');
    });

    await act(async () => {
      await result.current.handleRenameProfile({ oldName: 'Active Profile', newName: 'Renamed Profile' });
    });

    expect(result.current.activeProfile).toBe('Renamed Profile');
  });

  test('handleRenameProfile does not change active profile when renaming different profile', async () => {
    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Active Profile', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Other Profile', servers: {} },
    ];
    const updatedProfiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Active Profile', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Renamed Profile', servers: {} },
    ];
    mockApi.renameProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Active Profile');
    });

    await act(async () => {
      await result.current.handleRenameProfile({ oldName: 'Other Profile', newName: 'Renamed Profile' });
    });

    expect(result.current.activeProfile).toBe('Active Profile');
  });

  test('handleRenameProfile handles errors', async () => {
    const error = new Error('Rename failed');
    mockApi.renameProfile.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    await expect(
      act(async () => {
        await result.current.handleRenameProfile({ oldName: 'Old', newName: 'New' });
      })
    ).rejects.toThrow('Rename failed');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to rename profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleRenameProfile handles invalid parameters', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    await expect(
      act(async () => {
        await result.current.handleRenameProfile('invalid');
      })
    ).rejects.toThrow('Invalid parameters for profile rename');

    expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters for handleRenameProfile:', 'invalid');
    consoleSpy.mockRestore();
  });

  test('handleDeleteProfile deletes profile successfully', async () => {
    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} },
    ];
    const updatedProfiles = [{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} }];
    mockApi.safeConfirm.mockResolvedValue(true);
    mockApi.deleteProfile.mockResolvedValue(updatedProfiles);
    mockApi.getActiveProfile.mockResolvedValue('Profile 2');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleDeleteProfile('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(mockApi.safeConfirm).toHaveBeenCalledWith('Are you sure you want to delete the profile "Profile 1"?');
    expect(mockApi.deleteProfile).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(result.current.profiles).toEqual(updatedProfiles);
    expect(result.current.activeProfile).toBe('Profile 2');
    expect(result.current.selectedProfileServer).toBeNull();
    consoleSpy.mockRestore();
  });

  test('handleDeleteProfile prevents deleting last profile', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Last Profile', servers: {} }];
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleDeleteProfile('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Cannot delete the last remaining profile');
    expect(mockApi.deleteProfile).not.toHaveBeenCalled();
  });

  test('handleDeleteProfile handles user cancellation', async () => {
    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} },
    ];
    mockApi.safeConfirm.mockResolvedValue(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleDeleteProfile('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Profile deletion cancelled by user');
    expect(mockApi.deleteProfile).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('handleDeleteProfile handles missing profile', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles([]);
    });

    await act(async () => {
      await result.current.handleDeleteProfile('non-existent');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Cannot find profile to delete');
    expect(mockApi.deleteProfile).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('handleDeleteProfile handles errors', async () => {
    const profiles = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} },
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Profile 2', servers: {} },
    ];
    const error = new Error('Delete failed');
    mockApi.safeConfirm.mockResolvedValue(true);
    mockApi.deleteProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleDeleteProfile('123e4567-e89b-12d3-a456-426614174000');
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Delete failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to delete profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleToggleProfileServer toggles server enabled state', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: false, overrides: {} },
        },
      },
    ];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleToggleProfileServer('server-1');
    });

    expect(mockApi.updateProfile).toHaveBeenCalledWith('Profile 1', {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Profile 1',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    });
    expect(result.current.profiles).toEqual(updatedProfiles);
  });

  test('handleToggleProfileServer creates server entry if missing', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleToggleProfileServer('server-1');
    });

    expect(result.current.profiles).toEqual(updatedProfiles);
  });

  test('handleToggleProfileServer handles errors', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }];
    const error = new Error('Toggle failed');
    mockApi.updateProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleToggleProfileServer('server-1');
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to toggle server: Toggle failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle server:', error);
    consoleSpy.mockRestore();
  });

  test('handleAddServerToProfile adds server to profile', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleAddServerToProfile('server-1');
    });

    expect(mockApi.updateProfile).toHaveBeenCalledWith('Profile 1', {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Profile 1',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    });
    expect(result.current.profiles).toEqual(updatedProfiles);
  });

  test('handleAddServerToProfile does not overwrite existing server', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: false, overrides: { name: 'custom' } },
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(profiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleAddServerToProfile('server-1');
    });

    // Should not have changed the existing server
    expect(mockApi.updateProfile).toHaveBeenCalledWith('Profile 1', profiles[0]);
  });

  test('handleAddServerToProfile handles errors', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }];
    const error = new Error('Add server failed');
    mockApi.updateProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleAddServerToProfile('server-1');
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to add server to profile: Add server failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to add server to profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleEditOverrides sets editing state', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.handleEditOverrides('server-1');
    });

    expect(result.current.selectedProfileServer).toBe('server-1');
    expect(result.current.isEditingOverrides).toBe(true);
  });

  test('handleRemoveServerFromProfile removes server', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
          'server-2': { enabled: true, overrides: {} },
        },
      },
    ];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-2': { enabled: true, overrides: {} },
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleRemoveServerFromProfile('server-1');
    });

    expect(result.current.profiles).toEqual(updatedProfiles);
  });

  test('handleRemoveServerFromProfile handles errors', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    const error = new Error('Remove failed');
    mockApi.updateProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
    });

    await act(async () => {
      await result.current.handleRemoveServerFromProfile('server-1');
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to remove server from profile: Remove failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to remove server from profile:', error);
    consoleSpy.mockRestore();
  });

  test('handleSaveOverrides saves server overrides', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    const updatedServer = { enabled: true, overrides: { command: 'custom' } };
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': updatedServer,
        },
      },
    ];
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
      result.current.setSelectedProfileServer('server-1');
      result.current.setIsEditingOverrides(true);
    });

    await act(async () => {
      await result.current.handleSaveOverrides(updatedServer);
    });

    expect(mockApi.updateProfile).toHaveBeenCalledWith('Profile 1', {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Profile 1',
      servers: {
        'server-1': updatedServer,
      },
    });
    expect(result.current.profiles).toEqual(updatedProfiles);
    expect(result.current.isEditingOverrides).toBe(false);
    expect(result.current.selectedProfileServer).toBeNull();
  });

  test('handleSaveOverrides handles errors', async () => {
    const profiles = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }];
    const error = new Error('Save failed');
    mockApi.updateProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
      result.current.setActiveProfile('Profile 1');
      result.current.setSelectedProfileServer('server-1');
    });

    await act(async () => {
      await result.current.handleSaveOverrides({ enabled: true, overrides: {} });
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to save overrides: Save failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save overrides:', error);
    consoleSpy.mockRestore();
  });

  test('handleRestoreProfileServerDefaults restores defaults', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: { command: 'custom' } },
        },
      },
    ];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    const serverMasterList = {
      'server-1': { name: 'Test Server', command: 'node' },
    };
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleRestoreProfileServerDefaults('server-1', 'Profile 1', serverMasterList);
    });

    expect(mockApi.updateProfile).toHaveBeenCalledWith('Profile 1', {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Profile 1',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    });
    expect(mockApi.safeAlert).toHaveBeenCalledWith('Server "Test Server" in profile "Profile 1" restored to defaults.');
  });

  test('handleRestoreProfileServerDefaults preserves enabled state', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: false, overrides: { command: 'custom' } },
        },
      },
    ];
    const updatedProfiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: false, overrides: {} },
        },
      },
    ];
    const serverMasterList = {
      'server-1': { name: 'Test Server' },
    };
    mockApi.updateProfile.mockResolvedValue(updatedProfiles);
    mockApi.safeAlert.mockResolvedValue();

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleRestoreProfileServerDefaults('server-1', 'Profile 1', serverMasterList);
    });

    // Verify enabled stayed false
    const callArgs = mockApi.updateProfile.mock.calls[0][1];
    expect(callArgs.servers['server-1'].enabled).toBe(false);
  });

  test('handleRestoreProfileServerDefaults handles errors', async () => {
    const profiles = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Profile 1',
        servers: {
          'server-1': { enabled: true, overrides: {} },
        },
      },
    ];
    const error = new Error('Restore failed');
    mockApi.updateProfile.mockRejectedValue(error);
    mockApi.safeAlert.mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles(profiles);
    });

    await act(async () => {
      await result.current.handleRestoreProfileServerDefaults('server-1', 'Profile 1', {});
    });

    expect(mockApi.safeAlert).toHaveBeenCalledWith('Failed to restore defaults: Restore failed');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to restore server defaults:', error);
    consoleSpy.mockRestore();
  });

  test('state setters work correctly', () => {
    const { result } = renderHook(() => useProfiles());

    act(() => {
      result.current.setProfiles([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Profile 1', servers: {} }]);
      result.current.setActiveProfile('Profile 1');
      result.current.setIsAddingProfile(true);
      result.current.setShowRenameModal(true);
      result.current.setSelectedProfileServer('server-1');
      result.current.setIsEditingOverrides(true);
      result.current.setShowServerSelectionModal(true);
    });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile).toBe('Profile 1');
    expect(result.current.isAddingProfile).toBe(true);
    expect(result.current.showRenameModal).toBe(true);
    expect(result.current.selectedProfileServer).toBe('server-1');
    expect(result.current.isEditingOverrides).toBe(true);
    expect(result.current.showServerSelectionModal).toBe(true);
  });
});
