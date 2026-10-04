import { theme, designTokens } from '../../app/theme';
import { MantineProvider, Button, TextInput } from '@mantine/core';
import { render } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';

describe('Delchan Health OS Design System Theme', () => {
  it('should export designTokens with correct primary colors', () => {
    expect(designTokens.colors.primary[50]).toBe('#F0FBF9');
    expect(designTokens.colors.primary[700]).toBe('#087F72');
  });

  it('should export designTokens with correct neutral colors', () => {
    expect(designTokens.colors.neutral.white).toBe('#FFFFFF');
    expect(designTokens.colors.neutral[950]).toBe('#17201F');
  });

  it('should have typography tokens defined', () => {
    expect(designTokens.typography.headings.h1.fontSize).toBeDefined();
    expect(designTokens.typography.body.default.fontSize).toBeDefined();
  });

  it('should have spacing tokens defined', () => {
    expect(designTokens.spacing[4]).toBeDefined(); // 16px
  });

  it('should have radius tokens defined', () => {
    expect(designTokens.radius.md).toBeDefined(); // 8px
  });

  it('should have breakpoints tokens defined', () => {
    expect(designTokens.breakpoints.md).toBe('62em');
  });

  it('should generate Mantine theme correctly with delchan primary colors', () => {
    expect(theme.colors?.delchanPrimary).toBeDefined();
    expect(theme.colors?.delchanPrimary?.[0]).toBe('#F0FBF9');
    expect(theme.primaryColor).toBe('delchanPrimary');
  });

  it('should inject semantic color scales correctly into the Mantine theme', () => {
    expect(theme.colors?.success).toBeDefined();
    expect(theme.colors?.error).toBeDefined();
    expect(theme.colors?.warning).toBeDefined();
    expect(theme.colors?.info).toBeDefined();

    // Verify a specific placeholder
    expect(theme.colors?.error?.[8]).toBe('#E03131'); // red.8 default
  });

  it('should correctly configure default core UI components sizing and properties', () => {
    // Buttons and Inputs should have custom logic inside components mapping
    expect(theme.components?.Button).toBeDefined();
    expect(theme.components?.TextInput).toBeDefined();

    // Check specific defaultProps applied centrally
    // @ts-ignore: Intentionally asserting deep component configuration structure
    expect(theme.components?.Card?.defaultProps?.radius).toBe('lg');
  });

  it('renders custom Delchan specific UI components successfully', () => {
    const { getByTestId, getByText } = render(
      <MantineProvider theme={theme}>
        <EmptyState title="No content" actionLabel="Create" onAction={() => {}} />
        <ErrorState title="Error occurred" />
        <StatusBadge status="active" />
        <SearchInput />
      </MantineProvider>
    );

    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByTestId('error-state')).toBeTruthy();
    expect(getByTestId('status-badge')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByText('Ativo')).toBeTruthy(); // Status badge resolution
  });

  it('MantineProvider should successfully render without throwing with the new theme', () => {
    const { getByTestId } = render(
      <MantineProvider theme={theme}>
        <div data-testid="test-child">Hello Delchan</div>
      </MantineProvider>
    );
    expect(getByTestId('test-child')).toBeTruthy();
    expect(getByTestId('test-child').textContent).toBe('Hello Delchan');
  });
});
