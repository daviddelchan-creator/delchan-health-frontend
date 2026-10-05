import { theme, designTokens } from '../../app/theme';

describe('Delchan Theme Configuration', () => {
  it('should export design tokens with primary and neutral colors', () => {
    expect(designTokens.colors).toHaveProperty('primary');
    expect(designTokens.colors).toHaveProperty('neutral');
  });

  it('should create a Mantine theme with delchan color tuples', () => {
    expect(theme.colors).toHaveProperty('delchanPrimary');
    expect(theme.colors).toHaveProperty('delchanNeutral');
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

  it('should configure defaultProps for Button', () => {
    const buttonProps = (theme.components as any).Button.defaultProps;
    expect(buttonProps).toBeDefined();
    expect(buttonProps.size).toBe('md');
    expect(buttonProps.radius).toBe('md');
  });
});
