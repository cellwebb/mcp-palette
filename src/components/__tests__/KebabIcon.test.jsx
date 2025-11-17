import React from 'react';
import { render } from '@testing-library/react';
import KebabIcon from '../KebabIcon';

describe('KebabIcon', () => {
  it('renders an SVG icon', () => {
    const { container } = render(<KebabIcon />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
  });

  it('renders three dots (paths)', () => {
    const { container } = render(<KebabIcon />);
    const paths = container.querySelectorAll('path');

    expect(paths).toHaveLength(3);
  });
});
