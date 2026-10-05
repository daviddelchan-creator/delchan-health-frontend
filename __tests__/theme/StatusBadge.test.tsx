import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../app/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
};

describe('StatusBadge', () => {
  it('renders with the provided text', () => {
    renderWithTheme(<StatusBadge status="success">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  // Mantine classes make checking exact hex difficult without parsing styles,
  // but we can ensure it renders without crashing for all states.
  const states = ['success', 'warning', 'error', 'info', 'neutral', 'pending'] as const;

  states.forEach(status => {
    it(`renders the ${status} status correctly`, () => {
      renderWithTheme(<StatusBadge status={status}>{status} state</StatusBadge>);
      expect(screen.getByText(`${status} state`)).toBeInTheDocument();
    });
  });
});
