"use client";

import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react-hooks';
import { ReactNode } from 'react';

// Medplum exige una URL absoluta (http/https). 
// Usamos nuestro origen local para que pase por el Proxy de next.config.mjs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/medplum/`;
  }
  return 'http://localhost:3000/api/medplum/';
};

const medplum = new MedplumClient({
  baseUrl: getBaseUrl(),
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