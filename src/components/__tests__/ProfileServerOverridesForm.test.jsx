import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileServerOverridesForm from '../ProfileServerOverridesForm';

describe('ProfileServerOverridesForm', () => {
  const mockMasterServer = {
    name: 'Test Server',
    command: 'npx',
    args: ['-y', '@test/server'],
    env: {
      NODE_ENV: 'production',
      API_KEY: 'master-key',
    },
  };

  const mockProfileServer = {
    enabled: true,
    overrides: {},
  };

  const mockCallbacks = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when masterServer is null', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={null}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Server not found in master list.')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls onCancel when Back button clicked in empty state', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={null}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    fireEvent.click(screen.getByText('Back'));
    expect(mockCallbacks.onCancel).toHaveBeenCalled();
  });

  it('renders form with master server data', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText(/Customize Test Server Server for Test Profile/)).toBeInTheDocument();
    expect(screen.getByText('Override Display Name')).toBeInTheDocument();
    expect(screen.getByText('Override Command')).toBeInTheDocument();
    expect(screen.getByText('Override Arguments')).toBeInTheDocument();
  });

  it('shows inherited values when override checkboxes are not checked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const inheritedValues = screen.getAllByText(/Using master list value:/);
    expect(inheritedValues[0].parentElement).toHaveTextContent('Test Server');
    expect(inheritedValues[1].parentElement).toHaveTextContent('npx');
  });

  it('toggles name override checkbox and shows input field', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const nameCheckbox = screen.getByLabelText('Override Display Name');
    fireEvent.click(nameCheckbox);

    expect(screen.getByPlaceholderText('Custom name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom name')).toHaveValue('Test Server');
  });

  it('updates name input value when typing', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const nameCheckbox = screen.getByLabelText('Override Display Name');
    fireEvent.click(nameCheckbox);

    const nameInput = screen.getByPlaceholderText('Custom name');
    fireEvent.change(nameInput, { target: { value: 'Custom Server Name' } });

    expect(nameInput).toHaveValue('Custom Server Name');
  });

  it('resets name to master value when unchecking override', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const nameCheckbox = screen.getByLabelText('Override Display Name');
    fireEvent.click(nameCheckbox);

    const nameInput = screen.getByPlaceholderText('Custom name');
    fireEvent.change(nameInput, { target: { value: 'Custom Server Name' } });

    // Uncheck the override
    fireEvent.click(nameCheckbox);

    // Check back to see the value was reset
    fireEvent.click(nameCheckbox);
    expect(screen.getByPlaceholderText('Custom name')).toHaveValue('Test Server');
  });

  it('toggles command override checkbox and shows input field', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const commandCheckbox = screen.getByLabelText('Override Command');
    fireEvent.click(commandCheckbox);

    expect(screen.getByPlaceholderText('Custom command')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom command')).toHaveValue('npx');
  });

  it('toggles args override checkbox and shows add argument interface', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    expect(screen.getByPlaceholderText('Enter argument')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('displays existing args when override is enabled', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    expect(screen.getByText('-y')).toBeInTheDocument();
    expect(screen.getByText('@test/server')).toBeInTheDocument();
  });

  it('adds new argument when Add button clicked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    const argInput = screen.getByPlaceholderText('Enter argument');
    fireEvent.change(argInput, { target: { value: '--verbose' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(screen.getByText('--verbose')).toBeInTheDocument();
    expect(argInput).toHaveValue('');
  });

  it('does not add empty argument', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    const addButton = screen.getByText('Add');
    const initialArgCount = screen.getAllByText('Remove').length;

    fireEvent.click(addButton);

    expect(screen.getAllByText('Remove')).toHaveLength(initialArgCount);
  });

  it('removes argument when Remove button clicked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByText('-y')).not.toBeInTheDocument();
  });

  it('displays environment variables', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('NODE_ENV')).toBeInTheDocument();
    expect(screen.getByText('API_KEY')).toBeInTheDocument();
  });

  it('disables env variable input when not overridden', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const envInputs = screen.getAllByDisplayValue('production');
    expect(envInputs[0]).toBeDisabled();
  });

  it('enables env variable input when override checkbox is checked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const nodeEnvCheckbox = screen.getByLabelText('NODE_ENV');
    fireEvent.click(nodeEnvCheckbox);

    const envInputs = screen.getAllByDisplayValue('production');
    expect(envInputs[0]).not.toBeDisabled();
  });

  it('updates env variable value when typing', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const nodeEnvCheckbox = screen.getByLabelText('NODE_ENV');
    fireEvent.click(nodeEnvCheckbox);

    const envInput = screen.getAllByDisplayValue('production')[0];
    fireEvent.change(envInput, { target: { value: 'development' } });

    expect(envInput).toHaveValue('development');
  });

  it('adds new environment variable', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const keyInput = screen.getByPlaceholderText('Variable name');
    const valueInput = screen.getByPlaceholderText('Value');
    const addButton = screen.getByText('Add New Variable');

    fireEvent.change(keyInput, { target: { value: 'NEW_VAR' } });
    fireEvent.change(valueInput, { target: { value: 'new-value' } });
    fireEvent.click(addButton);

    expect(screen.getByText('NEW_VAR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('new-value')).toBeInTheDocument();
  });

  it('clears env var inputs after adding', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const keyInput = screen.getByPlaceholderText('Variable name');
    const valueInput = screen.getByPlaceholderText('Value');
    const addButton = screen.getByText('Add New Variable');

    fireEvent.change(keyInput, { target: { value: 'NEW_VAR' } });
    fireEvent.change(valueInput, { target: { value: 'new-value' } });
    fireEvent.click(addButton);

    expect(keyInput).toHaveValue('');
    expect(valueInput).toHaveValue('');
  });

  it('does not add env var with empty key', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const valueInput = screen.getByPlaceholderText('Value');
    const addButton = screen.getByText('Add New Variable');
    const initialEnvCount = Object.keys(mockMasterServer.env).length;

    fireEvent.change(valueInput, { target: { value: 'new-value' } });
    fireEvent.click(addButton);

    // Should still have the same number of env vars (only from master)
    const envVarItems = document.querySelectorAll('.env-var-item');
    expect(envVarItems).toHaveLength(initialEnvCount);
  });

  it('removes environment variable', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    // Click remove on first env var
    fireEvent.click(removeButtons[0]);

    // NODE_ENV should be moved to removed section
    expect(screen.getByText('Removed Environment Variables')).toBeInTheDocument();

    // Should still have NODE_ENV text, but in removed section
    const envVarsList = document.querySelector('.env-vars-list');
    expect(envVarsList).not.toHaveTextContent('NODE_ENV');
  });

  it('shows removed env vars section when master env var is removed', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove NODE_ENV

    expect(screen.getByText('Removed Environment Variables')).toBeInTheDocument();
  });

  it('restores removed env var when Restore button clicked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove NODE_ENV

    const restoreButton = screen.getByText('Restore');
    fireEvent.click(restoreButton);

    expect(screen.getByText('NODE_ENV')).toBeInTheDocument();
    expect(screen.queryByText('Removed Environment Variables')).not.toBeInTheDocument();
  });

  it('calls onSave with overrides when form is submitted', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    // Enable name override
    const nameCheckbox = screen.getByLabelText('Override Display Name');
    fireEvent.click(nameCheckbox);

    const nameInput = screen.getByPlaceholderText('Custom name');
    fireEvent.change(nameInput, { target: { value: 'Custom Name' } });

    const saveButton = screen.getByText('Save Overrides');
    fireEvent.click(saveButton);

    expect(mockCallbacks.onSave).toHaveBeenCalledWith({
      enabled: true,
      overrides: {
        name: 'Custom Name',
      },
    });
  });

  it('calls onSave with all override types', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    // Override name
    const nameCheckbox = screen.getByLabelText('Override Display Name');
    fireEvent.click(nameCheckbox);
    fireEvent.change(screen.getByPlaceholderText('Custom name'), { target: { value: 'New Name' } });

    // Override command
    const commandCheckbox = screen.getByLabelText('Override Command');
    fireEvent.click(commandCheckbox);
    fireEvent.change(screen.getByPlaceholderText('Custom command'), { target: { value: 'node' } });

    // Override args
    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    // Override env var
    const envCheckbox = screen.getByLabelText('NODE_ENV');
    fireEvent.click(envCheckbox);
    fireEvent.change(screen.getAllByDisplayValue('production')[0], { target: { value: 'development' } });

    const saveButton = screen.getByText('Save Overrides');
    fireEvent.click(saveButton);

    expect(mockCallbacks.onSave).toHaveBeenCalledWith({
      enabled: true,
      overrides: {
        name: 'New Name',
        command: 'node',
        args: ['-y', '@test/server'],
        env: {
          NODE_ENV: 'development',
        },
      },
    });
  });

  it('includes removed env vars as null in overrides', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    // Remove an env var
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Remove NODE_ENV

    const saveButton = screen.getByText('Save Overrides');
    fireEvent.click(saveButton);

    expect(mockCallbacks.onSave).toHaveBeenCalledWith({
      enabled: true,
      overrides: {
        env: {
          NODE_ENV: null,
        },
      },
    });
  });

  it('calls onCancel when Cancel button clicked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockCallbacks.onCancel).toHaveBeenCalled();
  });

  it('shows JSON preview when Preview JSON button clicked', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    fireEvent.click(screen.getByText('Preview JSON'));

    // ServerJsonViewer is rendered - we can check for its back button
    expect(screen.getByText('Back to Form')).toBeInTheDocument();
  });

  it('initializes with existing overrides', () => {
    const profileServerWithOverrides = {
      enabled: true,
      overrides: {
        name: 'Custom Server',
        command: 'node',
        args: ['server.js'],
        env: {
          NODE_ENV: 'development',
        },
      },
    };

    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={profileServerWithOverrides}
        {...mockCallbacks}
      />
    );

    // Name override should be checked and have custom value
    expect(screen.getByLabelText('Override Display Name')).toBeChecked();
    expect(screen.getByPlaceholderText('Custom name')).toHaveValue('Custom Server');

    // Command override should be checked
    expect(screen.getByLabelText('Override Command')).toBeChecked();
    expect(screen.getByPlaceholderText('Custom command')).toHaveValue('node');

    // Args override should be checked
    expect(screen.getByLabelText('Override Arguments')).toBeChecked();
    expect(screen.getByText('server.js')).toBeInTheDocument();

    // Env override should be checked and have custom value
    expect(screen.getByLabelText('NODE_ENV')).toBeChecked();
    expect(screen.getAllByDisplayValue('development')[0]).not.toBeDisabled();
  });

  it('handles profileServer with null overrides env var', () => {
    const profileServerWithRemovedEnv = {
      enabled: true,
      overrides: {
        env: {
          NODE_ENV: null, // Explicitly removed
        },
      },
    };

    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={profileServerWithRemovedEnv}
        {...mockCallbacks}
      />
    );

    // Should show NODE_ENV in removed section
    expect(screen.getByText('Removed Environment Variables')).toBeInTheDocument();
    const removedSection = document.querySelector('.removed-env-list');
    expect(removedSection).toHaveTextContent('NODE_ENV');
  });

  it('handles masterServer without env', () => {
    const masterWithoutEnv = {
      ...mockMasterServer,
      env: undefined,
    };

    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={masterWithoutEnv}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    // Should render without errors
    expect(screen.getByText('Environment Variables')).toBeInTheDocument();
  });

  it('handles masterServer with empty args', () => {
    const masterWithEmptyArgs = {
      ...mockMasterServer,
      args: [],
    };

    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={masterWithEmptyArgs}
        profileServer={mockProfileServer}
        {...mockCallbacks}
      />
    );

    const argsCheckbox = screen.getByLabelText('Override Arguments');
    fireEvent.click(argsCheckbox);

    // Should not show any arg items (the args list should be empty)
    const argsList = document.querySelector('.args-list');
    expect(argsList).not.toBeInTheDocument();
  });

  it('handles undefined profileServer', () => {
    render(
      <ProfileServerOverridesForm
        serverId="server-1"
        profileName="Test Profile"
        masterServer={mockMasterServer}
        profileServer={undefined}
        {...mockCallbacks}
      />
    );

    // Should render with master server values
    expect(screen.getByText(/Customize Test Server Server for Test Profile/)).toBeInTheDocument();

    // When saved, enabled should default to true
    const saveButton = screen.getByText('Save Overrides');
    fireEvent.click(saveButton);

    expect(mockCallbacks.onSave).toHaveBeenCalledWith({
      enabled: true,
      overrides: {},
    });
  });
});
