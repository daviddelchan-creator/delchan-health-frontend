"use client";

import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react-hooks';
import { ReactNode } from 'react';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/medplum/`;
  }
  return process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'https://delchan-health-portal-medplum.6jpght.easypanel.host/';
};

const medplum = new MedplumClient({
  baseUrl: getBaseUrl(),
  onUnauthenticated: () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/api')) {
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