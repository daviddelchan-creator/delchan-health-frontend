import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider, Button } from '@mantine/core';
import { theme, designTokens } from '../../app/theme';

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

describe('Button Styles Configuration', () => {
  it('configures exact hover and active states for custom variants', () => {
    // Extract the styles function from the theme
    const stylesFn = (theme.components as any).Button.styles;
    expect(typeof stylesFn).toBe('function');

    // Test secondary
    const secondaryStyles = stylesFn(theme, {}, { variant: 'secondary' });
    expect(secondaryStyles.root['&:hover'].backgroundColor).toBe(designTokens.colors.neutral[50]);
    expect(secondaryStyles.root['&:active'].backgroundColor).toBe(designTokens.colors.neutral[100]);

    // Test tertiary
    const tertiaryStyles = stylesFn(theme, {}, { variant: 'tertiary' });
    expect(tertiaryStyles.root['&:hover'].backgroundColor).toBe(designTokens.colors.neutral[50]);
    expect(tertiaryStyles.root['&:active'].backgroundColor).toBe(designTokens.colors.neutral[100]);

    // Test danger
    const dangerStyles = stylesFn(theme, {}, { variant: 'danger' });
    expect(dangerStyles.root['&:hover'].backgroundColor).toBe(designTokens.colors.error[600]);
    expect(dangerStyles.root['&:active'].backgroundColor).toBe(designTokens.colors.error[700]);

    // Test link
    const linkStyles = stylesFn(theme, {}, { variant: 'link' });
    expect(linkStyles.root['&:hover'].textDecoration).toBe('underline');
    expect(linkStyles.root['&:active'].color).toBe(designTokens.colors.primary[800]);
  });
});
