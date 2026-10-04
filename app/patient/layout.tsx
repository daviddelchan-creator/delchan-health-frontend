"use client";

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { PatientAppShell } from './components/PatientAppShell';
import { MedplumClient } from '@medplum/core';

// This layout isolates the Patient Portal experience using the custom UI-2.4.2 PatientAppShell
export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In a real scenario, this relies strictly on auth/me via MedplumClient wrapper hook
  // We use a simplified mock fetch for the structural preview
  useEffect(() => {
    // Simulate fetching the authenticated session's patient profile
    // without relying on query params or client-side patientId injection
    setTimeout(() => {
       setProfile({ resourceType: 'Patient', name: [{ given: ['João'], family: 'Silva' }] });
       setLoading(false);
    }, 500);
  }, []);

  const handleLogout = () => {
    // Simulate logout clearing tokens
    router.push('/login');
  };

  // We skip wrapping the standalone pre-anamnese page with the AppShell
  const pathname = usePathname();
  if (pathname?.includes('/anamnese')) {
    return <>{children}</>;
  }

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Carregando...</div>;
  }

  return (
    <PatientAppShell profile={profile} onLogout={handleLogout}>
      {children}
    </PatientAppShell>
  );
}
