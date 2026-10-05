import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../app/theme';
import { ErrorState } from '../../components/ui/ErrorState';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
};

describe('ErrorState', () => {
  it('renders default title and message', () => {
    renderWithTheme(<ErrorState />);
    expect(screen.getByText('Ocorreu um erro')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível carregar as informações. Tente novamente.')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    renderWithTheme(<ErrorState title="Oops!" message="Something went wrong." />);
    expect(screen.getByText('Oops!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders a retry button and handles clicks', () => {
    const handleRetry = jest.fn();
    renderWithTheme(<ErrorState onRetry={handleRetry} retryLabel="Retry Now" />);

    const button = screen.getByRole('button', { name: /retry now/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
