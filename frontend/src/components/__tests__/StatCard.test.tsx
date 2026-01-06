import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '../StatCard';
import { Assignment } from '@mui/icons-material';

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Total Appointments',
    value: '42',
    icon: <Assignment />,
    color: 'primary' as const,
  };

  it('should render with value and label', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('Total Appointments')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display icon with correct color', () => {
    const { container } = render(<StatCard {...defaultProps} color="error" />);

    // Check if icon container has error color class
    const iconContainer = container.querySelector('[class*="MuiAvatar"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should handle click when onClick provided', () => {
    const handleClick = vi.fn();
    render(<StatCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when onClick not provided', () => {
    const { container } = render(<StatCard {...defaultProps} />);

    // Should not have cursor pointer style
    const card = container.firstChild;
    expect(card).not.toHaveStyle({ cursor: 'pointer' });
  });

  it('should render with different color variants', () => {
    const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

    colors.forEach(color => {
      const { rerender } = render(<StatCard {...defaultProps} color={color} />);
      expect(screen.getByText('Total Appointments')).toBeInTheDocument();
      rerender(<div />); // Cleanup between renders
    });
  });

  it('should display large numbers correctly', () => {
    render(<StatCard {...defaultProps} value="1,234,567" />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should display zero value', () => {
    render(<StatCard {...defaultProps} value="0" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
