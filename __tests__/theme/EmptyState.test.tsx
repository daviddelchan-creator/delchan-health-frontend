import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../app/theme';
import { EmptyState } from '../../components/ui/EmptyState';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
};

describe('EmptyState', () => {
  it('renders title and description', () => {
    renderWithTheme(
      <EmptyState title="No Data" description="Try again later" />
    );
    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders an icon if provided', () => {
    renderWithTheme(
      <EmptyState title="No Data" icon={<span data-testid="test-icon">Icon</span>} />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders an action button and handles clicks', () => {
    const handleAction = jest.fn();
    renderWithTheme(
      <EmptyState title="No Data" actionLabel="Create New" onAction={handleAction} />
    );

    const button = screen.getByRole('button', { name: /create new/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
