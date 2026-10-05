import { theme, designTokens } from '../../app/theme';
import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import React from 'react';

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
