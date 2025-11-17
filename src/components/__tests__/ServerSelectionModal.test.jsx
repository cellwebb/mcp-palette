import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServerSelectionModal from '../ServerSelectionModal';

// Mock window.api
global.window.api = {
  safeConfirm: jest.fn(),
  safeAlert: jest.fn(),
};

describe('ServerSelectionModal', () => {
  const mockServerMasterList = {
    'server-1': {
      name: 'Test Server 1',
      command: 'npx',
      args: ['-y', '@test/server1'],
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
    },
  };

  const mockCurrentProfileServers = {
    'server-1': { enabled: true, overrides: {} },
  };

  const mockOnClose = jest.fn();
  const mockOnAddServer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when show is false', () => {
    const { container } = render(
      <ServerSelectionModal
        show={false}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when show is true', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText('Add Servers from Master List')).toBeInTheDocument();
  });

  it('displays all servers from master list', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText('Test Server 1')).toBeInTheDocument();
    expect(screen.getByText('Test Server 2')).toBeInTheDocument();
    expect(screen.getByText('server-three')).toBeInTheDocument(); // Uses originalId as display name
  });

  it('shows originalId for servers that have it', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText('Original ID: original-2')).toBeInTheDocument();
  });

  it('displays server commands', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText(/npx -y @test\/server1/)).toBeInTheDocument();
    expect(screen.getByText(/node server2.js/)).toBeInTheDocument();
  });

  it('disables checkboxes for already included servers', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        currentProfileServers={mockCurrentProfileServers}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const server1Checkbox = checkboxes[0]; // First server (server-1)

    expect(server1Checkbox).toBeDisabled();
  });

  it('shows "(Already added)" badge for included servers', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        currentProfileServers={mockCurrentProfileServers}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText('(Already added)')).toBeInTheDocument();
  });

  it('toggles server selection when checkbox is clicked', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const server2Checkbox = checkboxes[1]; // Second server (not disabled)

    expect(server2Checkbox).not.toBeChecked();

    fireEvent.click(server2Checkbox);
    expect(server2Checkbox).toBeChecked();

    fireEvent.click(server2Checkbox);
    expect(server2Checkbox).not.toBeChecked();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking on overlay', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const overlay = screen.getByText('Add Servers from Master List').closest('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal content', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const modalContent = screen.getByText('Add Servers from Master List').closest('.modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables Add button when no servers selected', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const addButton = screen.getByText('Add Selected Servers');
    expect(addButton).toBeDisabled();
  });

  it('enables Add button when servers are selected', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select second server

    const addButton = screen.getByText('Add Selected Servers');
    expect(addButton).not.toBeDisabled();
  });

  it('disables add button and does not call alert when no servers selected', () => {
    window.api.safeAlert.mockResolvedValue();

    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const addButton = screen.getByText('Add Selected Servers');
    expect(addButton).toBeDisabled();

    // The button being disabled prevents the click, so alert won't be called
    expect(window.api.safeAlert).not.toHaveBeenCalled();
  });

  it('adds single server without confirmation', async () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select second server

    const addButton = screen.getByText('Add Selected Servers');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddServer).toHaveBeenCalledWith('server-2');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows confirmation and adds multiple servers when confirmed', async () => {
    window.api.safeConfirm.mockResolvedValue(true);

    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select second server
    fireEvent.click(checkboxes[2]); // Select third server

    const addButton = screen.getByText('Add Selected Servers');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(window.api.safeConfirm).toHaveBeenCalledWith(
        'Add 2 servers to your profile?'
      );
      expect(mockOnAddServer).toHaveBeenCalledTimes(2);
      expect(mockOnAddServer).toHaveBeenCalledWith('server-2');
      expect(mockOnAddServer).toHaveBeenCalledWith('server-3');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not add servers when confirmation is cancelled', async () => {
    window.api.safeConfirm.mockResolvedValue(false);

    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    const addButton = screen.getByText('Add Selected Servers');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(window.api.safeConfirm).toHaveBeenCalled();
    });

    expect(mockOnAddServer).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows empty state when no servers in master list', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={{}}
        onAddServer={mockOnAddServer}
      />
    );

    expect(screen.getByText('No servers available in the Master List.')).toBeInTheDocument();
  });

  it('calls Cancel button handler', () => {
    render(
      <ServerSelectionModal
        show={true}
        onClose={mockOnClose}
        serverMasterList={mockServerMasterList}
        onAddServer={mockOnAddServer}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
