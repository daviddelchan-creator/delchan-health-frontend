// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
'use client';
import '@mantine/core/styles.css';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import '@medplum/react/styles.css';
import type { JSX, ReactNode } from 'react';

// EL TÚNEL MEJORADO: Usamos la URL real para el servidor, y el proxy local para el navegador
const URL_SERVIDOR = typeof window === 'undefined' 
  ? 'https://delchan-health-portal-medplum.6jpght.easypanel.host/' 
  : window.location.origin + '/api/medplum/';

const medplum = new MedplumClient({
  baseUrl: URL_SERVIDOR,
  clientId: '756a7e0c-e87f-499d-8ce6-da02a33921ea',
  
  onUnauthenticated: () => (window.location.href = '/'),
  fetch: (url: string, options?: any) => fetch(url, options),
  cacheTime: 10000,
});

export default function Root(props: { children: ReactNode }): JSX.Element {
  return <MedplumProvider medplum={medplum}>{props.children}</MedplumProvider>;
}