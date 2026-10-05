"use client";

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { PatientAppShell } from './components/PatientAppShell';

// This layout isolates the Patient Portal experience using the custom UI-2.4.2 PatientAppShell
export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real scenario, this relies strictly on auth/me via MedplumClient wrapper hook.
    // We attempt an authorized API fetch against the patient dashboard,
    // enforcing an unauthorized 401/403 state fallback since the secure token is not natively piped into this layout yet.
    const attemptProfileFetch = async () => {
       try {
          const res = await fetch('/api/patient/dashboard', {
             headers: {
                'Authorization': `Bearer ${typeof localStorage !== 'undefined' ? localStorage.getItem('medplum-token') || '' : ''}`
             }
          });

          if (res.status === 401 || res.status === 403) {
             setError('Sessão expirada ou não autorizada. Faça o login novamente no aplicativo.');
             setLoading(false);
             return;
          }

          if (!res.ok) {
             throw new Error('Falha ao carregar perfil do paciente');
          }

          const data = await res.json();
          setProfile(data.profile);
       } catch (err: any) {
          setError('Houve um problema de conexão com o servidor.');
       } finally {
          setLoading(false);
       }
    };

    attemptProfileFetch();
  }, []);

  const handleLogout = () => {
    // Clear tokens logic should go here
    router.push('/login');
  };

  const pathname = usePathname();
  // We skip wrapping the standalone pre-anamnese page with the AppShell
  if (pathname?.includes('/anamnese')) {
    return <>{children}</>;
  }

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Carregando Perfil do Paciente...</div>;
  }

  if (error || !profile) {
    return (
       <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Acesso Restrito</h2>
          <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '24px' }}>
             {error || 'Não foi possível validar sua identidade clínica. O portal exige um login autêntico derivado do Medplum FHIR Server.'}
          </p>
          <button
             onClick={() => router.push('/')}
             style={{ padding: '10px 20px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
             Voltar ao Início
          </button>
       </div>
    );
  }

  return (
    <PatientAppShell profile={profile} onLogout={handleLogout}>
      {children}
    </PatientAppShell>
  );
}
