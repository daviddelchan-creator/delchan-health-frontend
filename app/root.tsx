"use client";

import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react-hooks';
import { ReactNode } from 'react';

// Conexión a tu servidor real en Easypanel
const medplum = new MedplumClient({
  baseUrl: 'https://delchan-app.6jpght.easypanel.host/', 
  onUnauthenticated: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
});

export default function Root({ children }: { children: ReactNode }) {
  return (
    <MedplumProvider medplum={medplum}>
      {children}
    </MedplumProvider>
  );
}