// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
'use client';

import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

export const designTokens = {
  colors: {
    primary: {
      50: '#F0FBF9',
      100: '#DDF5F2',
      200: '#B5E6E0',
      300: '#78D1C7',
      400: '#36B8A9',
      500: '#12A594',
      600: '#0A9485',
      700: '#087F72',
      800: '#06665C', // Generated for Mantine 10-shade scale
      900: '#044D45', // Generated for Mantine 10-shade scale
    },
    neutral: {
      white: '#FFFFFF',
      50: '#F7F9F8',
      100: '#EEF1F0',
      200: '#E2E6E5',
      300: '#CBD1CF',
      400: '#A5AEAC',
      500: '#84908D',
      600: '#66736F',
      700: '#4B5956',
      800: '#34403E',
      900: '#25302E',
      950: '#17201F',
    },
    semantic: {
      success: {
        background: '#E6FCF5', // teal.0
        border: '#63E6BE', // teal.4
        text: '#099268', // teal.8
        icon: '#099268',
      },
      error: {
        background: '#FFF5F5', // red.0
        border: '#FF8787', // red.4
        text: '#E03131', // red.8
        icon: '#E03131',
      },
      warning: {
        background: '#FFF9DB', // yellow.0
        border: '#FFE066', // yellow.4
        text: '#F08C00', // yellow.8
        icon: '#F08C00',
      },
      info: {
        background: '#E7F5FF', // blue.0
        border: '#74C0FC', // blue.4
        text: '#1971C2', // blue.8
        icon: '#1971C2',
      },
    },
  },
  backgrounds: {
    application: '#F7F9F8',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F3F2',
    surfaceElevated: '#FFFFFF',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headings: {
      display: { fontSize: rem(36), lineHeight: rem(44) },
      h1: { fontSize: rem(30), lineHeight: rem(38) },
      h2: { fontSize: rem(24), lineHeight: rem(32) },
      h3: { fontSize: rem(20), lineHeight: rem(28) },
      h4: { fontSize: rem(17), lineHeight: rem(24) },
    },
    body: {
      large: { fontSize: rem(16), lineHeight: rem(24) },
      default: { fontSize: rem(14), lineHeight: rem(22) },
      small: { fontSize: rem(13), lineHeight: rem(20) },
      caption: { fontSize: rem(12), lineHeight: rem(18) },
    },
  },
  spacing: {
    1: rem(4),
    2: rem(8),
    3: rem(12),
    4: rem(16),
    5: rem(20),
    6: rem(24),
    7: rem(28),
    8: rem(32),
    10: rem(40),
    12: rem(48),
    16: rem(64),
    20: rem(80),
  },
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
    '2xl': rem(20),
    pill: rem(999),
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  borders: {
    thin: `1px solid #E2E6E5`, // Neutral 200
    base: `1px solid #CBD1CF`, // Neutral 300
    thick: `2px solid #CBD1CF`, // Neutral 300
  },
  controls: {
    small: rem(32),
    default: rem(40),
    large: rem(48),
  },
  motion: {
    fast: '120ms',
    normal: '180ms',
    slow: '240ms',
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
};

const primaryColors: MantineColorsTuple = [
  designTokens.colors.primary[50],
  designTokens.colors.primary[100],
  designTokens.colors.primary[200],
  designTokens.colors.primary[300],
  designTokens.colors.primary[400],
  designTokens.colors.primary[500],
  designTokens.colors.primary[600],
  designTokens.colors.primary[700],
  designTokens.colors.primary[800],
  designTokens.colors.primary[900],
];

const neutralColors: MantineColorsTuple = [
  designTokens.colors.neutral[50],
  designTokens.colors.neutral[100],
  designTokens.colors.neutral[200],
  designTokens.colors.neutral[300],
  designTokens.colors.neutral[400],
  designTokens.colors.neutral[500],
  designTokens.colors.neutral[600],
  designTokens.colors.neutral[700],
  designTokens.colors.neutral[800],
  designTokens.colors.neutral[900],
];

// Mapping Mantine default color palettes for semantic usage to satisfy MantineColorsTuple
const successColors: MantineColorsTuple = ['#E6FCF5', '#C3FAE8', '#96F2D7', '#63E6BE', '#38D9A9', '#20C997', '#12B886', '#099268', '#087F5B', '#099268'];
const errorColors: MantineColorsTuple = ['#FFF5F5', '#FFE3E3', '#FFC9C9', '#FFA8A8', '#FF8787', '#FF6B6B', '#FA5252', '#F03E3E', '#E03131', '#C92A2A'];
const warningColors: MantineColorsTuple = ['#FFF9DB', '#FFF3BF', '#FFEC99', '#FFE066', '#FFD43B', '#FCC419', '#FAB005', '#F59F00', '#F08C00', '#E67700'];
const infoColors: MantineColorsTuple = ['#E7F5FF', '#D0EBFF', '#A5D8FF', '#74C0FC', '#4DABF7', '#339AF0', '#228BE6', '#1C7ED6', '#1971C2', '#1864AB'];


export const theme = createTheme({
  colors: {
    delchanPrimary: primaryColors,
    delchanNeutral: neutralColors,
    success: successColors,
    error: errorColors,
    warning: warningColors,
    info: infoColors,
  },
  primaryColor: 'delchanPrimary',
  primaryShade: 5,
  fontFamily: designTokens.typography.fontFamily,
  headings: {
    fontFamily: designTokens.typography.fontFamily,
    sizes: {
      h1: { fontSize: designTokens.typography.headings.h1.fontSize, lineHeight: designTokens.typography.headings.h1.lineHeight },
      h2: { fontSize: designTokens.typography.headings.h2.fontSize, lineHeight: designTokens.typography.headings.h2.lineHeight },
      h3: { fontSize: designTokens.typography.headings.h3.fontSize, lineHeight: designTokens.typography.headings.h3.lineHeight },
      h4: { fontSize: designTokens.typography.headings.h4.fontSize, lineHeight: designTokens.typography.headings.h4.lineHeight },
    },
  },
  spacing: {
    xs: designTokens.spacing[2], // 8px
    sm: designTokens.spacing[3], // 12px
    md: designTokens.spacing[4], // 16px
    lg: designTokens.spacing[6], // 24px
    xl: designTokens.spacing[8], // 32px
  },
  radius: {
    xs: designTokens.radius.xs,
    sm: designTokens.radius.sm,
    md: designTokens.radius.md,
    lg: designTokens.radius.lg,
    xl: designTokens.radius.xl,
  },
  breakpoints: designTokens.breakpoints,
  components: {
    Button: {
      defaultProps: {
        size: 'default',
        radius: 'md',
      },
      vars: (theme: any, props: any) => {
        if (props.size === 'small') {
          return { root: { '--button-height': rem(32), '--button-padding-x': rem(16) } };
        }
        if (props.size === 'default' || props.size === undefined) {
          return { root: { '--button-height': rem(40), '--button-padding-x': rem(20) } };
        }
        if (props.size === 'large') {
          return { root: { '--button-height': rem(48), '--button-padding-x': rem(24) } };
        }
        return { root: {} };
      },
      classNames: {
        root: 'delchan-btn',
      },
      styles: (theme: any, props: any) => {
        let styles: any = {};
        if (props.variant === 'danger') {
          styles = {
            root: {
              backgroundColor: theme.colors.error[8],
              color: theme.colors.delchanNeutral[0],
              '&:hover': { backgroundColor: theme.colors.error[9] }
            }
          }
        } else if (props.variant === 'secondary') {
           styles = {
             root: {
               backgroundColor: theme.colors.delchanPrimary[0],
               color: theme.colors.delchanPrimary[8],
               '&:hover': { backgroundColor: theme.colors.delchanPrimary[1] }
             }
           }
        } else if (props.variant === 'tertiary') {
            styles = {
              root: {
                backgroundColor: 'transparent',
                color: theme.colors.delchanNeutral[6],
                '&:hover': { backgroundColor: theme.colors.delchanNeutral[1] }
              }
            }
        }
        return styles;
      }
    },
    ActionIcon: {
      defaultProps: {
        size: 'default',
        radius: 'md',
      },
      vars: (theme: any, props: any) => {
        if (props.size === 'small') return { root: { '--ai-size': rem(32) } };
        if (props.size === 'default' || props.size === undefined) return { root: { '--ai-size': rem(40) } };
        if (props.size === 'large') return { root: { '--ai-size': rem(48) } };
        return { root: {} };
      }
    },
    TextInput: {
      defaultProps: { size: 'md', radius: 'md' },
    },
    Select: {
      defaultProps: { size: 'md', radius: 'md' },
    },
    Textarea: {
      defaultProps: { size: 'md', radius: 'md' },
    },
    Checkbox: {
      defaultProps: { size: 'sm', radius: 'sm' },
    },
    Radio: {
      defaultProps: { size: 'sm' },
    },
    Switch: {
      defaultProps: { size: 'sm', radius: 'xl' },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        p: 'lg',
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
        fw: 600,
      },
    },
    Avatar: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },
    Alert: {
      defaultProps: {
        radius: 'md',
      },
    },
    Drawer: {
      defaultProps: {
        position: 'right',
        padding: 'md',
        size: 'md',
      },
      classNames: {
        content: 'delchan-drawer-content',
        header: 'delchan-drawer-header',
        body: 'delchan-drawer-body',
      },
    },
    Modal: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        centered: true,
      },
    },
    Tooltip: {
      defaultProps: {
        radius: 'sm',
        withArrow: true,
        openDelay: 300,
      },
    },
    Popover: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Menu: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
  },
});
