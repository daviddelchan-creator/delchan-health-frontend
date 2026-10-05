import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider, Button } from '@mantine/core';
import { theme } from '../../app/theme';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
};

describe('Button Variants & States', () => {
  it('renders primary button by default', () => {
    renderWithTheme(<Button>Primary</Button>);
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
  });

  const variants = ['secondary', 'tertiary', 'danger', 'link'] as const;

  variants.forEach(variant => {
    it(`renders ${variant} variant without crashing`, () => {
      renderWithTheme(<Button variant={variant}>{variant} btn</Button>);
      const button = screen.getByRole('button', { name: `${variant} btn` });
      expect(button).toBeInTheDocument();
      // Verifying the class applied by the theme configuration
      expect(button).toHaveClass('delchan-button');
    });
  });

  it('renders disabled state correctly', () => {
    renderWithTheme(<Button disabled>Disabled Btn</Button>);
    const button = screen.getByRole('button', { name: 'Disabled Btn' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled');
  });

  it('renders loading state accessible', () => {
    renderWithTheme(<Button loading>Loading Btn</Button>);
    // Mantine handles loading by disabling the button and setting a data attribute
    const button = screen.getByRole('button', { name: 'Loading Btn' });
    expect(button).toHaveAttribute('data-loading');
    expect(button).toBeDisabled();

    // There should be a loader element inside
    const loader = document.querySelector('.mantine-Button-loader');
    expect(loader).toBeInTheDocument();
  });
});
