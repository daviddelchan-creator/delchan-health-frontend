import { theme, designTokens } from '../../app/theme';

describe('Delchan Theme Configuration', () => {
  it('should export design tokens with primary and neutral colors matching UI-2.1 specs', () => {
    expect(designTokens.colors).toHaveProperty('primary');
    expect(designTokens.colors).toHaveProperty('neutral');
    expect(designTokens.colors.primary[50]).toBe('#F0FBF9');
    expect(designTokens.colors.primary[700]).toBe('#087F72');
    expect(designTokens.colors.neutral[950]).toBe('#17201F');
  });

  it('should include typography, spacing, radius, and exact breakpoints', () => {
    expect(designTokens.typography).toBeDefined();
    expect(designTokens.spacing).toBeDefined();
    expect(designTokens.radius).toBeDefined();
    expect(designTokens.breakpoints.md).toBe('62em');
  });

  it('should create a Mantine theme with delchan color tuples', () => {
    expect(theme.colors).toHaveProperty('delchanPrimary');
    expect(theme.colors).toHaveProperty('delchanNeutral');
    expect(theme.primaryColor).toBe('delchanPrimary');
  });

  it('should export design tokens with semantic colors', () => {
    expect(designTokens.colors).toHaveProperty('success');
    expect(designTokens.colors).toHaveProperty('warning');
    expect(designTokens.colors).toHaveProperty('error');
    expect(designTokens.colors).toHaveProperty('info');
  });

  it('should create a Mantine theme with delchan semantic tuples', () => {
    expect(theme.colors).toHaveProperty('delchanSuccess');
    expect(theme.colors).toHaveProperty('delchanWarning');
    expect(theme.colors).toHaveProperty('delchanError');
    expect(theme.colors).toHaveProperty('delchanInfo');
  });

  it('should export design tokens with shadows and borders', () => {
    expect(designTokens.shadows).toHaveProperty('sm');
    expect(designTokens.borders).toHaveProperty('default');
  });

  it('should configure defaultProps for Button', () => {
    const buttonProps = (theme.components as any).Button.defaultProps;
    expect(buttonProps).toBeDefined();
    expect(buttonProps.size).toBe('md');
    expect(buttonProps.radius).toBe('md');
  });
});
