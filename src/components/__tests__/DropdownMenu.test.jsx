import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DropdownMenu from '../DropdownMenu';

describe('DropdownMenu', () => {
  const mockItems = [
    { label: 'Item 1', action: jest.fn() },
    { label: 'Item 2', action: jest.fn(), icon: '🔧' },
    { label: 'Item 3', action: jest.fn(), type: 'danger' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button with KebabIcon', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    expect(button).toBeInTheDocument();

    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not show menu initially', () => {
    render(<DropdownMenu items={mockItems} />);

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('opens menu when trigger button is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('closes menu when trigger button is clicked again', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });

    fireEvent.click(button);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('calls action when menu item is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    const menuItem = screen.getByText('Item 1');
    fireEvent.click(menuItem);

    expect(mockItems[0].action).toHaveBeenCalledTimes(1);
  });

  it('closes menu after menu item is clicked', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    const menuItem = screen.getByText('Item 1');
    fireEvent.click(menuItem);

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    const iconSpan = screen.getByText('🔧');
    expect(iconSpan).toHaveClass('dropdown-menu-item-icon');
  });

  it('applies type class to menu items', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    const menuItem = screen.getByText('Item 3').parentElement;
    expect(menuItem).toHaveClass('dropdown-menu-item', 'danger');
  });

  it('closes menu when clicking outside', () => {
    render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('menu closes when clicking outside of dropdown container', () => {
    const { container } = render(<DropdownMenu items={mockItems} />);

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    // Menu is rendered in a portal, find it in document.body
    const menuPortal = document.body.querySelector('.dropdown-menu-portal');
    expect(menuPortal).toBeInTheDocument();

    // The menu should close when clicking on something that's not part of the dropdown container
    // This is tested by the "closes menu when clicking outside" test above
    // Here we verify that clicking on the dropdown container element doesn't close the menu

    const dropdownContainer = container.querySelector('.dropdown-menu-container');
    fireEvent.mouseDown(dropdownContainer);

    // Menu should still be open
    expect(document.body.querySelector('.dropdown-menu-portal')).toBeInTheDocument();
  });

  it('stops event propagation on trigger button click', () => {
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <DropdownMenu items={mockItems} />
      </div>
    );

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    expect(parentClick).not.toHaveBeenCalled();
  });

  it('stops event propagation on menu item click', () => {
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <DropdownMenu items={mockItems} />
      </div>
    );

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(button);

    const menuItem = screen.getByText('Item 1');
    fireEvent.click(menuItem);

    expect(parentClick).not.toHaveBeenCalled();
  });

  describe('disabled state', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<DropdownMenu items={mockItems} disabled={true} />);

      const button = screen.getByRole('button', { name: 'More options' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled');
    });

    it('applies disabled styles', () => {
      render(<DropdownMenu items={mockItems} disabled={true} />);

      const button = screen.getByRole('button', { name: 'More options' });
      expect(button).toHaveStyle({ opacity: '0.5', cursor: 'not-allowed' });
    });

    it('does not open menu when disabled and clicked', () => {
      render(<DropdownMenu items={mockItems} disabled={true} />);

      const button = screen.getByRole('button', { name: 'More options' });
      fireEvent.click(button);

      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('applies enabled styles when not disabled', () => {
      render(<DropdownMenu items={mockItems} disabled={false} />);

      const button = screen.getByRole('button', { name: 'More options' });
      expect(button).toHaveStyle({ opacity: '1', cursor: 'pointer' });
    });
  });

  it('stops propagation on mouseDown event', () => {
    const parentMouseDown = jest.fn();

    render(
      <div onMouseDown={parentMouseDown}>
        <DropdownMenu items={mockItems} />
      </div>
    );

    const button = screen.getByRole('button', { name: 'More options' });
    fireEvent.mouseDown(button);

    expect(parentMouseDown).not.toHaveBeenCalled();
  });
});
