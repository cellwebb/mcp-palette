import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmButton from '../ConfirmButton';

describe('ConfirmButton', () => {
  let confirmSpy;
  let consoleLogSpy;

  beforeEach(() => {
    confirmSpy = jest.spyOn(window, 'confirm');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('renders button with label', () => {
    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={() => {}} />);

    expect(screen.getByRole('button')).toHaveTextContent('Delete');
  });

  it('applies custom className', () => {
    render(
      <ConfirmButton
        label="Delete"
        confirmMessage="Are you sure?"
        onConfirm={() => {}}
        className="custom-class"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('applies default className when not provided', () => {
    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={() => {}} />);

    expect(screen.getByRole('button')).toHaveClass('button button-secondary');
  });

  it('applies custom style', () => {
    render(
      <ConfirmButton
        label="Delete"
        confirmMessage="Are you sure?"
        onConfirm={() => {}}
        style={{ color: 'red' }}
      />
    );

    expect(screen.getByRole('button')).toHaveStyle({ color: 'red' });
  });

  it('shows confirmation dialog when clicked', () => {
    confirmSpy.mockReturnValue(true);
    const onConfirm = jest.fn();

    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button'));

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
  });

  it('calls onConfirm when user confirms', () => {
    confirmSpy.mockReturnValue(true);
    const onConfirm = jest.fn();

    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when user cancels', () => {
    confirmSpy.mockReturnValue(false);
    const onConfirm = jest.fn();

    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('stops event propagation when clicked', () => {
    confirmSpy.mockReturnValue(true);
    const onConfirm = jest.fn();
    const parentClick = jest.fn();

    const { container } = render(
      <div onClick={parentClick}>
        <ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={onConfirm} />
      </div>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(parentClick).not.toHaveBeenCalled();
  });

  it('logs confirmation result', () => {
    confirmSpy.mockReturnValue(true);

    render(<ConfirmButton label="Delete" confirmMessage="Are you sure?" onConfirm={() => {}} />);

    fireEvent.click(screen.getByRole('button'));

    expect(consoleLogSpy).toHaveBeenCalledWith('Confirmation result:', true);
  });
});
