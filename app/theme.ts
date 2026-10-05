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
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
  },
});
