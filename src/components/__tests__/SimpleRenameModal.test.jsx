import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimpleRenameModal from '../SimpleRenameModal';

// Mock window.api
global.window.api = {
  renameProfile: jest.fn(),
};

// Mock console methods
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

describe('SimpleRenameModal', () => {
  const mockProfiles = [
    { id: '1', name: 'Profile 1' },
    { id: '2', name: 'Profile 2' },
    { id: '3', name: 'Existing Profile' },
  ];

  const mockProps = {
    isOpen: true,
    profileName: 'Profile 1',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    profiles: mockProfiles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns null when not open', () => {
    const { container } = render(<SimpleRenameModal {...mockProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(<SimpleRenameModal {...mockProps} />);

    expect(screen.getByText('Rename Profile')).toBeInTheDocument();
  });

  it('initializes input with profileName', () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    expect(input).toHaveValue('Profile 1');
  });

  it('focuses and selects input on open', async () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('updates input value when typing', () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Profile Name' } });

    expect(input).toHaveValue('New Profile Name');
  });

  it('calls onCancel when Escape key is pressed', () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables button when name is only whitespace', () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '   ' } });

    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('shows error when name is duplicate', async () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'existing profile' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('A profile with the name "existing profile" already exists')).toBeInTheDocument();
    });
  });

  it('does not submit when name is unchanged', async () => {
    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'Profile 1' } });

    // The button should be disabled
    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('calls window.api.renameProfile when onRenameProfile not provided', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    window.api.renameProfile.mockResolvedValue(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(window.api.renameProfile).toHaveBeenCalledWith({
        oldName: 'Profile 1',
        newName: 'New Name',
      });
      expect(mockProps.onSuccess).toHaveBeenCalledWith(updatedProfiles);
    });
  });

  it('calls onRenameProfile when provided', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    const onRenameProfile = jest.fn().mockResolvedValue(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} onRenameProfile={onRenameProfile} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(onRenameProfile).toHaveBeenCalledWith({
        oldName: 'Profile 1',
        newName: 'New Name',
      });
      expect(mockProps.onSuccess).toHaveBeenCalledWith(updatedProfiles);
    });
  });

  it('falls back to legacy format when object format fails', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    const onRenameProfile = jest.fn()
      .mockRejectedValueOnce(new Error('Object format failed'))
      .mockResolvedValueOnce(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} onRenameProfile={onRenameProfile} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(onRenameProfile).toHaveBeenCalledTimes(2);
      expect(onRenameProfile).toHaveBeenNthCalledWith(1, {
        oldName: 'Profile 1',
        newName: 'New Name',
      });
      expect(onRenameProfile).toHaveBeenNthCalledWith(2, 'Profile 1', 'New Name');
      expect(mockProps.onSuccess).toHaveBeenCalledWith(updatedProfiles);
    });
  });

  it('shows error when profile not found', async () => {
    render(<SimpleRenameModal {...mockProps} profileName="Nonexistent" profiles={mockProfiles} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('Profile "Nonexistent" not found')).toBeInTheDocument();
    });
  });

  it('shows error when API call fails with "already exists"', async () => {
    window.api.renameProfile.mockRejectedValue(new Error('Profile already exists'));

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('A profile with the name "New Name" already exists')).toBeInTheDocument();
    });
  });

  it('shows error when API method is not a function', async () => {
    window.api.renameProfile.mockImplementation(() => {
      throw new Error('renameProfile is not a function');
    });

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('Internal error: The rename function is not available')).toBeInTheDocument();
    });
  });

  it('shows generic error for other failures', async () => {
    window.api.renameProfile.mockRejectedValue(new Error('Network error'));

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables rename button while submitting', async () => {
    window.api.renameProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(renameButton).toBeDisabled();
    });
  });

  it('prevents multiple submissions while processing', async () => {
    window.api.renameProfile.mockResolvedValue([]);

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');

    // Click multiple times quickly
    fireEvent.click(renameButton);
    fireEvent.click(renameButton);
    fireEvent.click(renameButton);

    await waitFor(() => {
      // Should only call API once
      expect(window.api.renameProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('resets error and submitting state when modal reopens', async () => {
    const { rerender } = render(<SimpleRenameModal {...mockProps} />);

    // Trigger an error (duplicate)
    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'existing profile' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText(/already exists/)).toBeInTheDocument();
    });

    // Close and reopen
    rerender(<SimpleRenameModal {...mockProps} isOpen={false} />);
    rerender(<SimpleRenameModal {...mockProps} isOpen={true} />);

    expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
  });

  it('trims whitespace from new name', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    window.api.renameProfile.mockResolvedValue(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '  New Name  ' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(window.api.renameProfile).toHaveBeenCalledWith({
        oldName: 'Profile 1',
        newName: 'New Name',
      });
    });
  });

  it('calls onCancel when Cancel button clicked', () => {
    render(<SimpleRenameModal {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles empty profiles array', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    window.api.renameProfile.mockResolvedValue(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} profiles={[]} profileName="Any Name" />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('Profile "Any Name" not found')).toBeInTheDocument();
    });
  });

  it('logs rename attempt', async () => {
    const updatedProfiles = [{ id: '1', name: 'New Name' }];
    window.api.renameProfile.mockResolvedValue(updatedProfiles);

    render(<SimpleRenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        'Attempting to rename profile from Profile 1 to New Name'
      );
      expect(console.log).toHaveBeenCalledWith('Rename successful:', updatedProfiles);
    });
  });
});
