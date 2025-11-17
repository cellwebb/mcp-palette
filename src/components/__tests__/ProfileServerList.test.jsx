import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileServerList from '../ProfileServerList';

// Mock navigator.clipboard
global.navigator.clipboard = {
  writeText: jest.fn(),
};

// Mock window.api
global.window.api = {
  safeAlert: jest.fn(),
};

// Mock console
global.console.error = jest.fn();

describe('ProfileServerList', () => {
  const mockMasterServers = {
    'server-1': {
      name: 'Test Server 1',
      command: 'npx',
      args: ['-y', '@test/server1'],
      env: { VAR1: 'value1' },
    },
    'server-2': {
      name: 'Test Server 2',
      command: 'node',
      args: ['server2.js'],
    },
    'server-3': {
      originalId: 'server-three',
      command: 'python',
      args: ['server3.py'],
      env: { PATH: '/usr/bin' },
    },
  };

  const mockProfile = {
    id: 'profile-1',
    name: 'Test Profile',
    servers: {
      'server-1': {
        enabled: true,
        overrides: {},
      },
      'server-2': {
        enabled: false,
        overrides: {
          command: 'bun',
        },
      },
      'server-3': {
        enabled: true,
        overrides: {},
      },
    },
  };

  const mockCallbacks = {
    onSelectServer: jest.fn(),
    onToggleServer: jest.fn(),
    onEditOverrides: jest.fn(),
    onRemoveServer: jest.fn(),
    onRestoreDefaults: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    navigator.clipboard.writeText.mockResolvedValue();
    window.api.safeAlert.mockResolvedValue();
  });

  it('renders empty state when profile has no servers', () => {
    const emptyProfile = { ...mockProfile, servers: {} };
    render(
      <ProfileServerList
        profile={emptyProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(
      screen.getByText('No servers in this profile. Add servers from the Server Master List.')
    ).toBeInTheDocument();
  });

  it('renders empty state when profile is null', () => {
    render(
      <ProfileServerList
        profile={null}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(
      screen.getByText('No servers in this profile. Add servers from the Server Master List.')
    ).toBeInTheDocument();
  });

  it('renders empty state when profile.servers is undefined', () => {
    const profileWithoutServers = { id: 'test', name: 'Test' };
    render(
      <ProfileServerList
        profile={profileWithoutServers}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(
      screen.getByText('No servers in this profile. Add servers from the Server Master List.')
    ).toBeInTheDocument();
  });

  it('renders all servers in profile', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Test Server 1')).toBeInTheDocument();
    expect(screen.getByText('Test Server 2')).toBeInTheDocument();
    expect(screen.getByText('server-three')).toBeInTheDocument();
  });

  it('displays server commands', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText(/npx -y @test\/server1/)).toBeInTheDocument();
    // server-2 has override to use 'bun' instead of 'node'
    expect(screen.getByText(/bun server2.js/)).toBeInTheDocument();
    expect(screen.getByText(/python server3.py/)).toBeInTheDocument();
  });

  it('shows environment variables count', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // server-1 and server-3 have env vars
    const envVars = screen.getAllByText(/Environment Variables:/);
    expect(envVars.length).toBeGreaterThan(0);
  });

  it('calls onSelectServer when server clicked', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const serverItem = screen.getByText('Test Server 1').closest('.profile-server-item');
    fireEvent.click(serverItem);

    expect(mockCallbacks.onSelectServer).toHaveBeenCalledWith('server-1');
  });

  it('applies active class to selected server', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        selectedServer="server-1"
        {...mockCallbacks}
      />
    );

    const serverItem = screen.getByText('Test Server 1').closest('.profile-server-item');
    expect(serverItem).toHaveClass('active');
  });

  it('applies disabled class to disabled servers', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const serverItem = screen.getByText('Test Server 2').closest('.profile-server-item');
    expect(serverItem).toHaveClass('disabled');
  });

  it('shows enabled/disabled status correctly', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const enabledStatuses = screen.getAllByText('Enabled');
    const disabledStatuses = screen.getAllByText('Disabled');

    // server-1 and server-3 are enabled, server-2 is disabled
    expect(enabledStatuses).toHaveLength(2);
    expect(disabledStatuses).toHaveLength(1);
  });

  it('calls onToggleServer when toggle clicked', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockCallbacks.onToggleServer).toHaveBeenCalled();
  });

  it('stops propagation when clicking toggle to prevent server selection', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const toggleDiv = screen.getByText('Test Server 1')
      .closest('.profile-server-item')
      .querySelector('.profile-server-enabled-toggle');

    fireEvent.click(toggleDiv);

    // onSelectServer should not be called because propagation was stopped
    expect(mockCallbacks.onSelectServer).not.toHaveBeenCalled();
  });

  it('shows customized indicator for servers with overrides', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // server-2 has overrides
    expect(screen.getByText('Customized')).toBeInTheDocument();
  });

  it('does not show customized indicator for servers without overrides', () => {
    const profileWithoutOverrides = {
      ...mockProfile,
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    };

    render(
      <ProfileServerList
        profile={profileWithoutOverrides}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByText('Customized')).not.toBeInTheDocument();
  });

  it('calls onEditOverrides when edit button clicked', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const editButton = screen.getAllByText('Add Overrides')[0];
    fireEvent.click(editButton);

    expect(mockCallbacks.onEditOverrides).toHaveBeenCalled();
  });

  it('stops propagation when clicking edit button to prevent server selection', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const editButton = screen.getAllByText('Add Overrides')[0];
    fireEvent.click(editButton);

    expect(mockCallbacks.onEditOverrides).toHaveBeenCalled();
    expect(mockCallbacks.onSelectServer).not.toHaveBeenCalled();
  });

  it('shows "Edit Overrides" button text when server has overrides', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Edit Overrides')).toBeInTheDocument();
  });

  it('shows "Add Overrides" button text when server has no overrides', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const addOverridesButtons = screen.getAllByText('Add Overrides');
    expect(addOverridesButtons.length).toBeGreaterThan(0);
  });

  it('shows Restore Defaults button only for servers with overrides', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // Only server-2 has overrides
    expect(screen.getByText('Restore Defaults')).toBeInTheDocument();
  });

  it('does not show Restore Defaults button for servers without overrides', () => {
    const profileWithoutOverrides = {
      ...mockProfile,
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    };

    render(
      <ProfileServerList
        profile={profileWithoutOverrides}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByText('Restore Defaults')).not.toBeInTheDocument();
  });

  it('renders sort controls', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has sort options for name, command, and enabled status', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const sortSelect = screen.getByRole('combobox');
    const options = Array.from(sortSelect.querySelectorAll('option')).map(
      (opt) => opt.value
    );

    expect(options).toEqual(['name', 'command', 'enabled']);
  });

  it('sorts servers by name by default', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const serverItems = screen.getAllByText(/Test Server|server-three/);
    const names = serverItems.map((item) => item.textContent);

    // Should be sorted alphabetically: server-three, Test Server 1, Test Server 2
    expect(names[0]).toContain('server-three');
    expect(names[1]).toContain('Test Server 1');
    expect(names[2]).toContain('Test Server 2');
  });

  it('sorts servers by command when selected', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'command' } });

    const commands = screen.getAllByText(/Command:/);
    const commandTexts = commands.map((el) =>
      el.parentElement.textContent.toLowerCase()
    );

    // Should be sorted: bun (server-2 has override), npx, python
    expect(commandTexts[0]).toContain('bun');
    expect(commandTexts[1]).toContain('npx');
    expect(commandTexts[2]).toContain('python');
  });

  it('sorts servers by enabled status when selected', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'enabled' } });

    const serverItems = screen.getAllByText(/Test Server|server-three/).map((el) =>
      el.closest('.profile-server-item')
    );

    // First two should be enabled (not have 'disabled' class)
    expect(serverItems[0]).not.toHaveClass('disabled');
    expect(serverItems[1]).not.toHaveClass('disabled');
    // Last one should be disabled
    expect(serverItems[2]).toHaveClass('disabled');
  });

  it('copies server JSON to clipboard when dropdown action clicked', async () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // Open first dropdown
    const dropdownButtons = screen.getAllByRole('button', { name: 'More options' });
    fireEvent.click(dropdownButtons[0]);

    // Click "Copy JSON to clipboard"
    const copyButton = screen.getByText('Copy JSON to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.api.safeAlert).toHaveBeenCalledWith(
        'Server configuration copied to clipboard'
      );
    });
  });

  it('shows error alert when clipboard copy fails', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const dropdownButtons = screen.getAllByRole('button', { name: 'More options' });
    fireEvent.click(dropdownButtons[0]);

    const copyButton = screen.getByText('Copy JSON to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to copy to clipboard: ',
        expect.any(Error)
      );
      expect(window.api.safeAlert).toHaveBeenCalledWith(
        'Failed to copy to clipboard'
      );
    });
  });

  it('renders Remove server button for all servers', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    const removeButtons = screen.getAllByText('Remove server from profile');
    expect(removeButtons).toHaveLength(3); // One for each server
  });

  it('skips rendering servers that no longer exist in master list', () => {
    const profileWithDeletedServer = {
      ...mockProfile,
      servers: {
        'server-1': { enabled: true, overrides: {} },
        'deleted-server': { enabled: true, overrides: {} },
      },
    };

    render(
      <ProfileServerList
        profile={profileWithDeletedServer}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // Only server-1 should be rendered
    expect(screen.getByText('Test Server 1')).toBeInTheDocument();
    expect(screen.queryByText('deleted-server')).not.toBeInTheDocument();
  });

  it('handles profile server with missing enabled field', () => {
    const profileWithMissingEnabled = {
      ...mockProfile,
      servers: {
        'server-1': { overrides: {} }, // No 'enabled' field
      },
    };

    render(
      <ProfileServerList
        profile={profileWithMissingEnabled}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('handles server with no env variables', () => {
    const profileWithOneServer = {
      ...mockProfile,
      servers: {
        'server-2': { enabled: true, overrides: {} },
      },
    };

    render(
      <ProfileServerList
        profile={profileWithOneServer}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // server-2 has no env in master config
    expect(screen.queryByText(/Environment Variables:/)).not.toBeInTheDocument();
  });

  it('handles server with empty args array', () => {
    const masterWithEmptyArgs = {
      'server-1': {
        name: 'Test Server',
        command: 'node',
        args: [],
      },
    };

    const profileWithServer = {
      id: 'test',
      name: 'Test',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    };

    render(
      <ProfileServerList
        profile={profileWithServer}
        masterServers={masterWithEmptyArgs}
        {...mockCallbacks}
      />
    );

    // Should just show command without any args
    expect(screen.getByText(/node/)).toBeInTheDocument();
  });

  it('displays effective config when server has overrides', () => {
    render(
      <ProfileServerList
        profile={mockProfile}
        masterServers={mockMasterServers}
        {...mockCallbacks}
      />
    );

    // server-2 has command override to 'bun'
    // Find the server-2 item and check its command
    const server2Item = screen.getByText('Test Server 2').closest('.profile-server-item');
    expect(server2Item.textContent).toContain('bun');
  });
});
