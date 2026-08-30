// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

// @ts-ignore
import '@mantine/core/styles.css';
// @ts-ignore
import '@mantine/tiptap/styles.css';
// @ts-ignore
import '@mantine/charts/styles.css'; // <-- AÑADIDO: Fundamental para los gráficos del nuevo Dashboard SaaS

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import type { JSX, ReactNode } from 'react';
import Root from './root';
import { theme } from './theme';
import { TenantProvider } from '../contexts/TenantContext';

export const metadata: Metadata = {
  title: 'Delchan Health OS',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout(props: { children: ReactNode }): JSX.Element {
  const { children } = props;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          
          {/* 1. ROOT INICIALIZA LA CONEXIÓN A MEDPLUM PRIMERO */}
          <Root>
            
            {/* 2. TENANTPROVIDER LEE EL TENANT Y CONTROLA EL GOD MODE */}
            <TenantProvider>
              {children}
            </TenantProvider>
            
          </Root>
          
        </MantineProvider>
      </body>
    </html>
  );
}