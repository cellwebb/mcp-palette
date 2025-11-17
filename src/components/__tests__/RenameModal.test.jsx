import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RenameModal from '../RenameModal';

describe('RenameModal', () => {
  const mockProfiles = [
    { id: '1', name: 'Profile 1' },
    { id: '2', name: 'Profile 2' },
    { id: '3', name: 'Existing Profile' },
  ];

  const mockProps = {
    isOpen: true,
    title: 'Rename Profile',
    initialName: 'Profile 1',
    onConfirm: jest.fn(),
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
    const { container } = render(<RenameModal {...mockProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(<RenameModal {...mockProps} />);

    expect(screen.getByText('Rename Profile')).toBeInTheDocument();
  });

  it('initializes input with initialName', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    expect(input).toHaveValue('Profile 1');
  });

  it('focuses and selects input on open', async () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');

    // Fast-forward the timeout
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('updates input value when typing', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Profile Name' } });

    expect(input).toHaveValue('New Profile Name');
  });

  it('disables Rename button when name is empty', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '' } });

    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('disables Rename button when name is only whitespace', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '   ' } });

    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('disables Rename button when name is unchanged', () => {
    render(<RenameModal {...mockProps} />);

    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('enables Rename button when name is changed', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    expect(renameButton).not.toBeDisabled();
  });

  it('disables button when name is only whitespace', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '   ' } });

    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('shows error when name is duplicate (case-insensitive)', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'existing profile' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(screen.getByText('A profile with the name "existing profile" already exists')).toBeInTheDocument();
  });

  it('does not show duplicate error for current name', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'profile 1' } });

    // This is the same as initialName, so it should call onCancel instead
    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
  });

  it('does not submit when name is unchanged', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'Profile 1' } });

    // The Rename button should be disabled
    const renameButton = screen.getByText('Rename');
    expect(renameButton).toBeDisabled();
  });

  it('calls onConfirm with trimmed names when valid', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '  New Name  ' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(mockProps.onConfirm).toHaveBeenCalledWith({
      oldName: 'Profile 1',
      newName: 'New Name',
    });
  });

  it('calls onCancel when Cancel button clicked', () => {
    render(<RenameModal {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    expect(mockProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when clicking overlay', () => {
    render(<RenameModal {...mockProps} />);

    const overlay = screen.getByText('Rename Profile').closest('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking modal content', () => {
    render(<RenameModal {...mockProps} />);

    const modalContent = screen.getByText('Rename Profile').closest('.modal-content');
    fireEvent.click(modalContent);

    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });

  it('submits form when pressing Enter in input', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    fireEvent.submit(input.closest('form'));

    expect(mockProps.onConfirm).toHaveBeenCalledWith({
      oldName: 'Profile 1',
      newName: 'New Name',
    });
  });

  it('resets input when modal reopens with different initialName', () => {
    const { rerender } = render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'Changed' } });
    expect(input).toHaveValue('Changed');

    // Close and reopen with different name
    rerender(<RenameModal {...mockProps} isOpen={false} />);
    rerender(<RenameModal {...mockProps} isOpen={true} initialName="Profile 2" />);

    const newInput = screen.getByPlaceholderText('Enter new name');
    expect(newInput).toHaveValue('Profile 2');
  });

  it('handles error when onConfirm throws', () => {
    const errorOnConfirm = jest.fn(() => {
      throw new Error('Failed to rename');
    });

    render(<RenameModal {...mockProps} onConfirm={errorOnConfirm} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(screen.getByText('Failed to rename')).toBeInTheDocument();
  });

  it('displays error with correct styling', () => {
    render(<RenameModal {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'existing profile' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    const errorDiv = screen.getByText(/already exists/);
    expect(errorDiv).toHaveClass('error-message');
    expect(errorDiv).toHaveStyle({
      color: 'red',
      backgroundColor: '#ffeeee',
    });
  });

  it('calls onConfirm when valid name is entered after error', () => {
    render(<RenameModal {...mockProps} />);

    // Trigger an error (duplicate name)
    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'existing profile' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(screen.getByText(/already exists/)).toBeInTheDocument();

    // Change input to valid value and try again
    fireEvent.change(input, { target: { value: 'Valid Name' } });
    fireEvent.click(renameButton);

    // onConfirm should still be called
    expect(mockProps.onConfirm).toHaveBeenCalled();
  });

  it('renders with default empty profiles array', () => {
    render(<RenameModal {...mockProps} profiles={undefined} />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: 'Any Name' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(mockProps.onConfirm).toHaveBeenCalled();
  });

  it('handles empty initialName', () => {
    render(<RenameModal {...mockProps} initialName="" />);

    const input = screen.getByPlaceholderText('Enter new name');
    expect(input).toHaveValue('');
  });

  it('trims whitespace from new name before validation', () => {
    render(<RenameModal {...mockProps} initialName="Test" />);

    const input = screen.getByPlaceholderText('Enter new name');
    fireEvent.change(input, { target: { value: '  Existing Profile  ' } });

    const renameButton = screen.getByText('Rename');
    fireEvent.click(renameButton);

    expect(screen.getByText('A profile with the name "Existing Profile" already exists')).toBeInTheDocument();
  });
});
