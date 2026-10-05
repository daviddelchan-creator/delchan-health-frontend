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

    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
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


const successColors: MantineColorsTuple = [
  designTokens.colors.success[50], designTokens.colors.success[100], designTokens.colors.success[200], designTokens.colors.success[300], designTokens.colors.success[400],
  designTokens.colors.success[500], designTokens.colors.success[600], designTokens.colors.success[700], designTokens.colors.success[800], designTokens.colors.success[900],
];

const warningColors: MantineColorsTuple = [
  designTokens.colors.warning[50], designTokens.colors.warning[100], designTokens.colors.warning[200], designTokens.colors.warning[300], designTokens.colors.warning[400],
  designTokens.colors.warning[500], designTokens.colors.warning[600], designTokens.colors.warning[700], designTokens.colors.warning[800], designTokens.colors.warning[900],
];

const errorColors: MantineColorsTuple = [
  designTokens.colors.error[50], designTokens.colors.error[100], designTokens.colors.error[200], designTokens.colors.error[300], designTokens.colors.error[400],
  designTokens.colors.error[500], designTokens.colors.error[600], designTokens.colors.error[700], designTokens.colors.error[800], designTokens.colors.error[900],
];

const infoColors: MantineColorsTuple = [
  designTokens.colors.info[50], designTokens.colors.info[100], designTokens.colors.info[200], designTokens.colors.info[300], designTokens.colors.info[400],
  designTokens.colors.info[500], designTokens.colors.info[600], designTokens.colors.info[700], designTokens.colors.info[800], designTokens.colors.info[900],
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

export const theme = createTheme({
  colors: {
    delchanPrimary: primaryColors,
    delchanNeutral: neutralColors,

    delchanSuccess: successColors,
    delchanWarning: warningColors,
    delchanError: errorColors,
    delchanInfo: infoColors,

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
        size: 'md',
        radius: 'md',
      },
      classNames: {
        root: 'delchan-button',
      },
      styles: (theme: any, params: any, context: any) => ({
        root: {
          fontWeight: 600,
        }
      })
    },
    ActionIcon: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        p: 'lg',
      },
      styles: {
        root: {
          backgroundColor: designTokens.backgrounds.surface,
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        }
      }
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      }
    }
  },
});
