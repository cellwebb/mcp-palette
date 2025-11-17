import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const mockProps = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title and message', () => {
    render(<ConfirmationModal {...mockProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders default confirm and cancel button text', () => {
    render(<ConfirmationModal {...mockProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom confirm button text', () => {
    render(<ConfirmationModal {...mockProps} confirmText="Yes, delete it" />);

    expect(screen.getByText('Yes, delete it')).toBeInTheDocument();
  });

  it('renders custom cancel button text', () => {
    render(<ConfirmationModal {...mockProps} cancelText="No, keep it" />);

    expect(screen.getByText('No, keep it')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmationModal {...mockProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmationModal {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    expect(mockProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when clicking overlay', () => {
    render(<ConfirmationModal {...mockProps} />);

    const overlay = screen.getByText('Confirm Action').closest('.modal-overlay');
    fireEvent.click(overlay);

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking modal content', () => {
    render(<ConfirmationModal {...mockProps} />);

    const modalContent = screen.getByText('Confirm Action').closest('.modal-content');
    fireEvent.click(modalContent);

    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });

  it('stops propagation when clicking modal content', () => {
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <ConfirmationModal {...mockProps} />
      </div>
    );

    const modalContent = screen.getByText('Confirm Action').closest('.modal-content');
    fireEvent.click(modalContent);

    // onCancel should not be called because propagation was stopped
    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });

  it('applies correct modal styling', () => {
    render(<ConfirmationModal {...mockProps} />);

    const overlay = screen.getByText('Confirm Action').closest('.modal-overlay');
    expect(overlay).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '9999',
    });
  });

  it('applies correct modal content styling', () => {
    render(<ConfirmationModal {...mockProps} />);

    const modalContent = screen.getByText('Confirm Action').closest('.modal-content');
    expect(modalContent).toHaveStyle({
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '4px',
      minWidth: '300px',
    });
  });

  it('renders confirm button with primary class', () => {
    render(<ConfirmationModal {...mockProps} />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('button', 'button-primary');
  });

  it('renders cancel button with secondary class', () => {
    render(<ConfirmationModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveClass('button', 'button-secondary');
  });

  it('renders modal actions with correct flex layout', () => {
    render(<ConfirmationModal {...mockProps} />);

    const modalActions = screen.getByText('Confirm').parentElement;
    expect(modalActions).toHaveClass('modal-actions');
    expect(modalActions).toHaveStyle({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    });
  });

  it('renders modal body with correct margin', () => {
    render(<ConfirmationModal {...mockProps} />);

    const modalBody = screen.getByText('Are you sure you want to proceed?').parentElement;
    expect(modalBody).toHaveClass('modal-body');
    expect(modalBody).toHaveStyle({ margin: '15px 0' });
  });
});
