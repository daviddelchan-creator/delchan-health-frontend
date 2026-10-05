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
    // Structural simulated fetch targeting the /api/patient/dashboard endpoint
    // We enforce an unauthorized state because the patient portal authentication logic
    // is not fully mapped in the legacy architecture yet (it relies on an isolated mobile layer).
    // Do not fabricate fake users or JWT tokens here.
    const attemptProfileFetch = async () => {
       try {
          const res = await fetch('/api/patient/dashboard', {
             headers: {
                // To fetch real data, a valid Bearer token from the local SecureStore/Auth context must be supplied.
                'Authorization': 'Bearer placeholder_if_needed'
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
