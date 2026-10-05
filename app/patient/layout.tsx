"use client";

import { AppShell, Group, Title, Avatar, ThemeIcon, Stack, Text, ActionIcon, NavLink } from '@mantine/core';
import React, { ReactNode } from 'react';
import { usePatientDashboardContext, PatientDashboardProvider } from './state/PatientDashboardContext';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loading } from '@/components/ui/Loading';

function PatientAppShellInner({ children }: { children: ReactNode }) {
  const { state, data } = usePatientDashboardContext();
  const pathname = usePathname();
  const router = useRouter();

  // Wait for initialization or loading
  if (state === 'INITIALIZING' || state === 'LOADING') {
    return (
      <div style={{ backgroundColor: 'var(--mantine-color-gray-2)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
         <Loading message="Carregando portal do paciente..." />
      </div>
    );
  }

  if (state === 'UNAUTHORIZED') {
    return (
       <div style={{ backgroundColor: 'var(--mantine-color-gray-2)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ErrorState
             title="Sessão Expirada"
             message="Por favor, faça login novamente para acessar o portal."
             onRetry={() => window.location.href = '/'}
             retryLabel="Fazer Login"
          />
       </div>
    );
  }

  if (state === 'FORBIDDEN') {
    return (
      <div style={{ backgroundColor: 'var(--mantine-color-gray-2)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
         <ErrorState
            title="Acesso Negado"
            message="Este portal é exclusivo para pacientes. Sua conta não tem permissão para acessá-lo."
         />
      </div>
   );
  }

  // Safe fallback if data is somehow missing when READY/EMPTY
  const patientName = data?.profile?.name?.[0]?.given?.join(' ') || 'Paciente';

  // Navigation logic
  const getActiveTab = () => {
     if (pathname.includes('/consultas')) return 'consultas';
     if (pathname.includes('/historico')) return 'historico';
     if (pathname.includes('/documentos')) return 'documentos';
     if (pathname.includes('/saude')) return 'saude';
     if (pathname.includes('/perfil')) return 'perfil';
     return 'inicio';
  };

  const activeTab = getActiveTab();

  return (
    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', minHeight: '100vh' }}>
        <AppShell
           header={{ height: 70 }}
           navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: true } }}
           footer={{ height: 80, collapsed: { desktop: true } }}
           padding="md"
        >

          <AppShell.Header bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <Group h="100%" px="md" justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                  <Text fw={800} size="lg">🧬</Text>
                </ThemeIcon>
                <Title order={4} c="dark.9" fw={800}>Portal do Paciente</Title>
              </Group>
              <Avatar color="teal" radius="xl">{patientName.charAt(0)}</Avatar>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar p="md" bg="white" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
            <NavLink
               label="Início"
               leftSection="🏠"
               active={activeTab === 'inicio'}
               onClick={() => router.push('/patient')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
            <NavLink
               label="Consultas"
               leftSection="🗓️"
               active={activeTab === 'consultas'}
               onClick={() => router.push('/patient/consultas')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
            <NavLink
               label="Histórico"
               leftSection="📋"
               active={activeTab === 'historico'}
               onClick={() => router.push('/patient/historico')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
            <NavLink
               label="Documentos"
               leftSection="📂"
               active={activeTab === 'documentos'}
               onClick={() => router.push('/patient/documentos')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
            <NavLink
               label="Saúde"
               leftSection="❤️"
               active={activeTab === 'saude'}
               onClick={() => router.push('/patient/saude')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
            <NavLink
               label="Perfil"
               leftSection="👤"
               active={activeTab === 'perfil'}
               onClick={() => router.push('/patient/perfil')}
               color="teal"
               variant="filled"
               style={{ borderRadius: '8px', marginBottom: '8px' }}
            />
          </AppShell.Navbar>

          <AppShell.Main>
            {children}
          </AppShell.Main>

          <AppShell.Footer bg="white" style={{ borderTop: '1px solid var(--mantine-color-gray-2)', padding: '10px 10px' }} zIndex={100}>
            <Group justify="space-between" align="center" h="100%" wrap="nowrap">
              <Stack gap={4} align="center" onClick={() => router.push('/patient')} style={{ cursor: 'pointer', flex: 1 }}>
                <Text size="xl" c={activeTab === 'inicio' ? 'teal' : 'gray.4'}>🏠</Text>
                <Text size="xs" fw={700} c={activeTab === 'inicio' ? 'teal' : 'gray.5'}>Início</Text>
              </Stack>
              <Stack gap={4} align="center" onClick={() => router.push('/patient/consultas')} style={{ cursor: 'pointer', flex: 1 }}>
                <Text size="xl" c={activeTab === 'consultas' ? 'teal' : 'gray.4'}>🗓️</Text>
                <Text size="xs" fw={700} c={activeTab === 'consultas' ? 'teal' : 'gray.5'}>Agenda</Text>
              </Stack>
              <Stack gap={4} align="center" onClick={() => router.push('/patient/historico')} style={{ cursor: 'pointer', flex: 1 }}>
                <Text size="xl" c={activeTab === 'historico' ? 'teal' : 'gray.4'}>📋</Text>
                <Text size="xs" fw={700} c={activeTab === 'historico' ? 'teal' : 'gray.5'}>Hist.</Text>
              </Stack>
              <Stack gap={4} align="center" onClick={() => router.push('/patient/documentos')} style={{ cursor: 'pointer', flex: 1, position: 'relative', top: '-10px' }}>
                <ActionIcon size={50} radius="xl" color="teal" variant={activeTab === 'documentos' ? 'filled' : 'light'} style={{ boxShadow: activeTab === 'documentos' ? '0 10px 15px -3px rgba(13, 148, 136, 0.4)' : 'none' }}>
                  <Text size="lg">📂</Text>
                </ActionIcon>
                <Text size="xs" fw={700} c={activeTab === 'documentos' ? 'teal' : 'gray.5'}>Docs</Text>
              </Stack>
              <Stack gap={4} align="center" onClick={() => router.push('/patient/saude')} style={{ cursor: 'pointer', flex: 1 }}>
                <Text size="xl" c={activeTab === 'saude' ? 'teal' : 'gray.4'}>❤️</Text>
                <Text size="xs" fw={700} c={activeTab === 'saude' ? 'teal' : 'gray.5'}>Saúde</Text>
              </Stack>
              <Stack gap={4} align="center" onClick={() => router.push('/patient/perfil')} style={{ cursor: 'pointer', flex: 1 }}>
                <Text size="xl" c={activeTab === 'perfil' ? 'teal' : 'gray.4'}>👤</Text>
                <Text size="xs" fw={700} c={activeTab === 'perfil' ? 'teal' : 'gray.5'}>Perfil</Text>
              </Stack>
            </Group>
          </AppShell.Footer>

        </AppShell>
    </div>
  );
}

export default function PatientAppShell({ children }: { children: ReactNode }) {
  return (
    <PatientDashboardProvider>
      <PatientAppShellInner>
         {children}
      </PatientAppShellInner>
    </PatientDashboardProvider>
  );
}
