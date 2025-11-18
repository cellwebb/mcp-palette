import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilesView from '../ProfilesView';

// Mock child components
jest.mock('../ProfileServerList', () => {
  return function MockProfileServerList() {
    return <div data-testid="profile-server-list">ProfileServerList</div>;
  };
});

jest.mock('../ProfileServerOverridesForm', () => {
  return function MockProfileServerOverridesForm() {
    return <div data-testid="profile-server-overrides-form">ProfileServerOverridesForm</div>;
  };
});

jest.mock('../JsonEditor', () => {
  return function MockJsonEditor({ json }) {
    return <div data-testid="json-editor">{json}</div>;
  };
});

describe('ProfilesView', () => {
  const mockProps = {
    currentProfile: {
      id: '123',
      name: 'Test Profile',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    },
    activeProfile: 'Test Profile',
    profiles: [
      { id: '123', name: 'Test Profile', servers: {} },
      { id: '456', name: 'Other Profile', servers: {} },
    ],
    serverMasterList: {
      'server-1': { name: 'Server 1', command: 'node' },
    },
    selectedProfileServer: null,
    isEditingOverrides: false,
    editMode: 'form',
    setEditMode: jest.fn(),
    onToggleServer: jest.fn(),
    onEditOverrides: jest.fn(),
    onRemoveServer: jest.fn(),
    onRestoreDefaults: jest.fn(),
    onSaveOverrides: jest.fn(),
    onCancelOverrides: jest.fn(),
    onShowServerSelectionModal: jest.fn(),
    onShowRenameModal: jest.fn(),
    onDeleteProfile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders null when no active profile', () => {
    const { container } = render(
      <ProfilesView {...mockProps} activeProfile={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders tabs in form view', () => {
    render(<ProfilesView {...mockProps} />);

    const tabs = screen.getAllByText(/View$/);
    expect(tabs).toHaveLength(2);
  });

  test('form tab is active when editMode is form', () => {
    render(<ProfilesView {...mockProps} editMode="form" />);

    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).not.toHaveClass('active');
  });

  test('json tab is active when editMode is json', () => {
    render(<ProfilesView {...mockProps} editMode="json" />);

    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0]).not.toHaveClass('active');
    expect(tabs[1]).toHaveClass('active');
  });

  test('clicking form tab calls setEditMode with form', () => {
    render(<ProfilesView {...mockProps} />);

    const tabs = document.querySelectorAll('.tab');
    tabs[0].click();

    expect(mockProps.setEditMode).toHaveBeenCalledWith('form');
  });

  test('clicking json tab calls setEditMode with json', () => {
    render(<ProfilesView {...mockProps} />);

    const tabs = document.querySelectorAll('.tab');
    tabs[1].click();

    expect(mockProps.setEditMode).toHaveBeenCalledWith('json');
  });

  test('renders ProfileServerOverridesForm when editing overrides', () => {
    render(
      <ProfilesView
        {...mockProps}
        isEditingOverrides={true}
        selectedProfileServer="server-1"
      />
    );

    expect(screen.getByTestId('profile-server-overrides-form')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-server-list')).not.toBeInTheDocument();
  });

  test('renders profile header when not editing overrides', () => {
    render(<ProfilesView {...mockProps} />);

    expect(screen.getByText('Servers in Profile: Test Profile')).toBeInTheDocument();
  });

  test('renders Add Server button', () => {
    render(<ProfilesView {...mockProps} />);

    expect(screen.getByText('Add Server from Master List')).toBeInTheDocument();
  });

  test('clicking Add Server button calls onShowServerSelectionModal', () => {
    render(<ProfilesView {...mockProps} />);

    const button = screen.getByText('Add Server from Master List');
    button.click();

    expect(mockProps.onShowServerSelectionModal).toHaveBeenCalled();
  });

  test('renders Rename Profile button', () => {
    render(<ProfilesView {...mockProps} />);

    expect(screen.getByText('Rename Profile')).toBeInTheDocument();
  });

  test('clicking Rename Profile button calls onShowRenameModal', () => {
    render(<ProfilesView {...mockProps} />);

    const button = screen.getByText('Rename Profile');
    button.click();

    expect(mockProps.onShowRenameModal).toHaveBeenCalled();
  });

  test('renders Delete Profile button when profile is empty and multiple profiles exist', () => {
    const propsWithEmptyProfile = {
      ...mockProps,
      currentProfile: { id: '123', name: 'Test Profile', servers: {} },
    };

    render(<ProfilesView {...propsWithEmptyProfile} />);

    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
  });

  test('does not render Delete Profile button when profile has servers', () => {
    render(<ProfilesView {...mockProps} />);

    expect(screen.queryByText('Delete Profile')).not.toBeInTheDocument();
  });

  test('does not render Delete Profile button when only one profile exists', () => {
    const propsWithOneProfile = {
      ...mockProps,
      profiles: [{ id: '123', name: 'Test Profile', servers: {} }],
      currentProfile: { id: '123', name: 'Test Profile', servers: {} },
    };

    render(<ProfilesView {...propsWithOneProfile} />);

    expect(screen.queryByText('Delete Profile')).not.toBeInTheDocument();
  });

  test('renders ProfileServerList when in form view and not editing', () => {
    render(<ProfilesView {...mockProps} />);

    expect(screen.getByTestId('profile-server-list')).toBeInTheDocument();
  });

  test('renders JsonEditor when in json view', () => {
    render(<ProfilesView {...mockProps} editMode="json" />);

    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
  });

  test('passes correct props to JsonEditor in json view', () => {
    render(<ProfilesView {...mockProps} editMode="json" />);

    const jsonEditor = screen.getByTestId('json-editor');
    expect(jsonEditor).toBeInTheDocument();
    // JSON should be valid and contain mcpServers
    const jsonContent = jsonEditor.textContent;
    expect(jsonContent).toContain('mcpServers');
  });

  test('handles error in generateFinalProfileConfig gracefully', () => {
    // Mock console.error to avoid polluting test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Pass invalid data that would cause generateFinalProfileConfig to throw
    const propsWithInvalidData = {
      ...mockProps,
      currentProfile: null,
    };

    const { container } = render(<ProfilesView {...propsWithInvalidData} editMode="json" />);

    // Should still render without crashing
    expect(container).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('clicking Delete Profile button shows confirmation and deletes on confirm', async () => {
    const propsWithEmptyProfile = {
      ...mockProps,
      currentProfile: { id: '123', name: 'Empty Profile', servers: {} },
      activeProfile: 'Empty Profile',
      profiles: [
        { id: '123', name: 'Empty Profile', servers: {} },
        { id: '456', name: 'Other Profile', servers: {} },
      ],
    };

    // Mock window.api.safeConfirm
    window.api = { safeConfirm: jest.fn().mockResolvedValue(true) };

    render(<ProfilesView {...propsWithEmptyProfile} />);

    const deleteButton = screen.getByText('Delete Profile');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.api.safeConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete the profile "Empty Profile"?'
      );
    });

    await waitFor(() => {
      expect(mockProps.onDeleteProfile).toHaveBeenCalledWith('123');
    });

    delete window.api;
  });

  test('clicking Delete Profile button cancels when user declines', async () => {
    const propsWithEmptyProfile = {
      ...mockProps,
      currentProfile: { id: '123', name: 'Empty Profile', servers: {} },
      activeProfile: 'Empty Profile',
      profiles: [
        { id: '123', name: 'Empty Profile', servers: {} },
        { id: '456', name: 'Other Profile', servers: {} },
      ],
    };

    // Mock window.api.safeConfirm to return false
    window.api = { safeConfirm: jest.fn().mockResolvedValue(false) };

    render(<ProfilesView {...propsWithEmptyProfile} />);

    const deleteButton = screen.getByText('Delete Profile');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.api.safeConfirm).toHaveBeenCalled();
    });

    // onDeleteProfile should not be called
    expect(mockProps.onDeleteProfile).not.toHaveBeenCalled();

    delete window.api;
  });
});
