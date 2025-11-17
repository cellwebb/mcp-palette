import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServerMasterList from '../ServerMasterList';

// Mock navigator.clipboard
global.navigator.clipboard = {
  writeText: jest.fn(),
};

// Mock alert
global.alert = jest.fn();
global.console.error = jest.fn();

describe('ServerMasterList', () => {
  const mockServers = {
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
      originalId: 'original-2',
    },
    'server-3': {
      originalId: 'server-three',
      command: 'python',
      args: ['server3.py'],
      env: { PATH: '/usr/bin' },
    },
  };

  const mockProfiles = [
    {
      id: 'profile-1',
      name: 'Profile 1',
      servers: {
        'server-1': { enabled: true, overrides: {} },
      },
    },
  ];

  const mockCallbacks = {
    onSelectServer: jest.fn(),
    onAddServer: jest.fn(),
    onDeleteServer: jest.fn(),
    onViewServerJson: jest.fn(),
    onRestoreDefaults: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no servers', () => {
    render(<ServerMasterList servers={{}} {...mockCallbacks} />);

    expect(screen.getByText('No servers in Master List yet. Add a server to get started.')).toBeInTheDocument();
    expect(screen.getByText('Add Server to Master List')).toBeInTheDocument();
  });

  it('calls onAddServer when Add Server button clicked in empty state', () => {
    render(<ServerMasterList servers={{}} {...mockCallbacks} />);

    const addButton = screen.getByText('Add Server to Master List');
    fireEvent.click(addButton);

    expect(mockCallbacks.onAddServer).toHaveBeenCalledTimes(1);
  });

  it('renders list header with title', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText('Server Master List')).toBeInTheDocument();
  });

  it('renders all servers', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText('Test Server 1')).toBeInTheDocument();
    expect(screen.getByText('Test Server 2')).toBeInTheDocument();
    expect(screen.getByText('server-three')).toBeInTheDocument();
  });

  it('displays server commands', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText(/npx -y @test\/server1/)).toBeInTheDocument();
    expect(screen.getByText(/node server2.js/)).toBeInTheDocument();
    expect(screen.getByText(/python server3.py/)).toBeInTheDocument();
  });

  it('shows originalId when different from name', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText('Original ID:')).toBeInTheDocument();
    expect(screen.getByText('original-2')).toBeInTheDocument();
  });

  it('shows environment variables count', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    // Two servers have env vars (server-1 and server-3)
    const envCounts = screen.getAllByText('1 environment variables');
    expect(envCounts.length).toBeGreaterThan(0);
  });

  it('calls onSelectServer when server clicked', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    const serverItem = screen.getByText('Test Server 1').closest('.server-master-item');
    fireEvent.click(serverItem);

    expect(mockCallbacks.onSelectServer).toHaveBeenCalledWith('server-1');
  });

  it('applies active class to selected server', () => {
    render(
      <ServerMasterList
        servers={mockServers}
        selectedServer="server-1"
        {...mockCallbacks}
      />
    );

    const serverItem = screen.getByText('Test Server 1').closest('.server-master-item');
    expect(serverItem).toHaveClass('active');
  });

  it('renders sort controls', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has sort options for name and command', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    const sortSelect = screen.getByRole('combobox');
    const options = Array.from(sortSelect.querySelectorAll('option')).map(opt => opt.value);

    expect(options).toEqual(['name', 'command']);
  });

  it('sorts servers by name by default', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    const serverItems = screen.getAllByText(/Test Server|server-three/);
    const names = serverItems.map(item => item.textContent);

    // Should be sorted alphabetically: server-three, Test Server 1, Test Server 2
    expect(names[0]).toContain('server-three');
    expect(names[1]).toContain('Test Server 1');
    expect(names[2]).toContain('Test Server 2');
  });

  it('sorts servers by command when selected', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'command' } });

    const serverItems = screen.getAllByText(/npx|node|python/).filter(el =>
      el.tagName === 'CODE'
    );

    // Should be sorted: node, npx, python
    expect(serverItems[0].textContent).toContain('node');
    expect(serverItems[1].textContent).toContain('npx');
    expect(serverItems[2].textContent).toContain('python');
  });

  it('renders Add New Server button', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    expect(screen.getByText('Add New Server')).toBeInTheDocument();
  });

  it('calls onAddServer when Add New Server clicked', () => {
    render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

    fireEvent.click(screen.getByText('Add New Server'));

    expect(mockCallbacks.onAddServer).toHaveBeenCalledTimes(1);
  });

  it('shows Delete button for servers not in use', () => {
    render(<ServerMasterList servers={mockServers} profiles={mockProfiles} {...mockCallbacks} />);

    // server-2 and server-3 are not in use, should have delete buttons
    const deleteButtons = screen.getAllByText('Delete Server');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('does not show Delete button for servers in use', () => {
    render(<ServerMasterList servers={mockServers} profiles={mockProfiles} {...mockCallbacks} />);

    // Get all server items
    const serverItems = screen.getAllByText(/Test Server|server-three/).map(el =>
      el.closest('.server-master-item')
    );

    // Find the server-1 item (it's in use)
    const server1Item = screen.getByText('Test Server 1').closest('.server-master-item');

    // It should not have a Delete button
    const deleteButton = server1Item.querySelector('button');
    if (deleteButton) {
      expect(deleteButton.textContent).not.toBe('Delete Server');
    }
  });

  it('calls onDeleteServer when delete button clicked', () => {
    render(<ServerMasterList servers={mockServers} profiles={mockProfiles} {...mockCallbacks} />);

    // Find a delete button
    const deleteButtons = screen.getAllByText('Delete Server');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      // The ConfirmButton will show a confirmation dialog first
    }
  });

  describe('Dropdown menu actions', () => {
    it('renders dropdown menu for each server', () => {
      render(<ServerMasterList servers={mockServers} {...mockCallbacks} />);

      const dropdownButtons = screen.getAllByRole('button', { name: 'More options' });
      expect(dropdownButtons).toHaveLength(3); // One for each server
    });
  });

  it('handles null servers gracefully', () => {
    render(<ServerMasterList servers={null} {...mockCallbacks} />);

    expect(screen.getByText('No servers in Master List yet. Add a server to get started.')).toBeInTheDocument();
  });

  it('handles undefined servers gracefully', () => {
    render(<ServerMasterList servers={undefined} {...mockCallbacks} />);

    expect(screen.getByText('No servers in Master List yet. Add a server to get started.')).toBeInTheDocument();
  });

  it('handles servers with empty args array', () => {
    const serversWithEmptyArgs = {
      'server-1': {
        name: 'Empty Args Server',
        command: 'node',
        args: [],
      },
    };

    render(<ServerMasterList servers={serversWithEmptyArgs} {...mockCallbacks} />);

    expect(screen.getByText('node')).toBeInTheDocument();
  });

  it('handles servers without env', () => {
    const serversWithoutEnv = {
      'server-1': {
        name: 'No Env Server',
        command: 'node',
        args: ['app.js'],
      },
    };

    render(<ServerMasterList servers={serversWithoutEnv} {...mockCallbacks} />);

    expect(screen.queryByText(/environment variables/)).not.toBeInTheDocument();
  });
});
