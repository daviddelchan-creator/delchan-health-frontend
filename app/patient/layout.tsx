"use client";

import { AppShell, Group, Title, Avatar, ThemeIcon, Stack, Text, ActionIcon, NavLink, UnstyledButton } from '@mantine/core';
import React, { ReactNode } from 'react';
import {
  IconHome,
  IconCalendarEvent,
  IconClipboardList,
  IconFolder,
  IconHeartbeat,
  IconUser,
  IconDna
} from '@tabler/icons-react';
import { usePatientDashboardContext, PatientDashboardProvider } from './state/PatientDashboardContext';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/ErrorState';

function PatientAppShellInner({ children }: { children: ReactNode }) {
  const { state, data } = usePatientDashboardContext();
  const pathname = usePathname();
  const router = useRouter();

  // Wait for initialization or loading
  if (state === 'INITIALIZING' || state === 'LOADING') {
    return (
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
         <Text c="dimmed">Carregando portal do paciente...</Text>
      </div>
    );
  }

  if (state === 'UNAUTHORIZED') {
    return (
       <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
     if (pathname === '/patient' || pathname === '/patient/') return 'inicio';
     if (pathname === '/patient/consultas' || pathname.startsWith('/patient/consultas/')) return 'consultas';
     if (pathname === '/patient/historico' || pathname.startsWith('/patient/historico/')) return 'historico';
     if (pathname === '/patient/documentos' || pathname.startsWith('/patient/documentos/')) return 'documentos';
     if (pathname === '/patient/saude' || pathname.startsWith('/patient/saude/')) return 'saude';
     if (pathname === '/patient/perfil' || pathname.startsWith('/patient/perfil/')) return 'perfil';
     return 'inicio';
  };

  const activeTab = getActiveTab();

  return (
    <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', minHeight: '100vh' }}>
        <AppShell
           header={{ height: 70 }}
           navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: true } }}
           footer={{ height: 80, collapsed: { desktop: true } as any }}
           padding="md"
        >

          <AppShell.Header bg="white" withBorder>
            <Group h="100%" px="md" justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                  <IconDna size={22} stroke={2.5} />
                </ThemeIcon>
                <Title order={4} c="dark.9" fw={800}>Portal do Paciente</Title>
              </Group>
              <Avatar color="teal" radius="xl">{patientName.charAt(0)}</Avatar>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar p="md" bg="white" withBorder>
            <NavLink
               label="Início"
               leftSection={<IconHome size={18} stroke={2} />}
               active={activeTab === 'inicio'}
               onClick={() => router.push('/patient')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 'var(--mantine-spacing-xs)' }}
            />
            <NavLink
               label="Consultas"
               leftSection={<IconCalendarEvent size={18} stroke={2} />}
               active={activeTab === 'consultas'}
               onClick={() => router.push('/patient/consultas')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 'var(--mantine-spacing-xs)' }}
            />
            <NavLink
               label="Histórico"
               leftSection={<IconClipboardList size={18} stroke={2} />}
               active={activeTab === 'historico'}
               onClick={() => router.push('/patient/historico')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 'var(--mantine-spacing-xs)' }}
            />
            <NavLink
               label="Documentos"
               leftSection={<IconFolder size={18} stroke={2} />}
               active={activeTab === 'documentos'}
               onClick={() => router.push('/patient/documentos')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 'var(--mantine-spacing-xs)' }}
            />
            <NavLink
               label="Saúde"
               leftSection={<IconHeartbeat size={18} stroke={2} />}
               active={activeTab === 'saude'}
               onClick={() => router.push('/patient/saude')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 'var(--mantine-spacing-xs)' }}
            />
            <NavLink
               label="Perfil"
               leftSection={<IconUser size={18} stroke={2} />}
               active={activeTab === 'perfil'}
               onClick={() => router.push('/patient/perfil')}
               color="teal"
               variant="filled"
               style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          </AppShell.Navbar>

          <AppShell.Main>
            {children}
          </AppShell.Main>

          <AppShell.Footer bg="white" withBorder px="xs" py="xs" zIndex={100}>
            <Group justify="space-between" align="center" h="100%" wrap="nowrap">
              <UnstyledButton onClick={() => router.push('/patient')} aria-label="Página Inicial" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)' }}>
                <Stack gap={4} align="center">
                  <IconHome size={24} color={activeTab === 'inicio' ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)'} stroke={activeTab === 'inicio' ? 2.5 : 1.5} />
                  <Text size="xs" fw={700} c={activeTab === 'inicio' ? 'teal' : 'dimmed'}>Início</Text>
                </Stack>
              </UnstyledButton>
              <UnstyledButton onClick={() => router.push('/patient/consultas')} aria-label="Agenda de Consultas" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)' }}>
                <Stack gap={4} align="center">
                  <IconCalendarEvent size={24} color={activeTab === 'consultas' ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)'} stroke={activeTab === 'consultas' ? 2.5 : 1.5} />
                  <Text size="xs" fw={700} c={activeTab === 'consultas' ? 'teal' : 'dimmed'}>Agenda</Text>
                </Stack>
              </UnstyledButton>
              <UnstyledButton onClick={() => router.push('/patient/historico')} aria-label="Histórico Clínico" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)' }}>
                <Stack gap={4} align="center">
                  <IconClipboardList size={24} color={activeTab === 'historico' ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)'} stroke={activeTab === 'historico' ? 2.5 : 1.5} />
                  <Text size="xs" fw={700} c={activeTab === 'historico' ? 'teal' : 'dimmed'}>Hist.</Text>
                </Stack>
              </UnstyledButton>
              <UnstyledButton onClick={() => router.push('/patient/documentos')} aria-label="Documentos e Resultados" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)', position: 'relative', top: '-10px' }}>
                <Stack gap={4} align="center">
                  <ThemeIcon size="xl" radius="xl" color="teal" variant={activeTab === 'documentos' ? 'filled' : 'light'} style={{ boxShadow: activeTab === 'documentos' ? 'var(--mantine-shadow-md)' : 'none', pointerEvents: 'none' }}>
                    <IconFolder size={22} stroke={2.5} />
                  </ThemeIcon>
                  <Text size="xs" fw={700} c={activeTab === 'documentos' ? 'teal' : 'dimmed'}>Docs</Text>
                </Stack>
              </UnstyledButton>
              <UnstyledButton onClick={() => router.push('/patient/saude')} aria-label="Minha Saúde" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)' }}>
                <Stack gap={4} align="center">
                  <IconHeartbeat size={24} color={activeTab === 'saude' ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)'} stroke={activeTab === 'saude' ? 2.5 : 1.5} />
                  <Text size="xs" fw={700} c={activeTab === 'saude' ? 'teal' : 'dimmed'}>Saúde</Text>
                </Stack>
              </UnstyledButton>
              <UnstyledButton onClick={() => router.push('/patient/perfil')} aria-label="Perfil e Configurações" style={{ flex: 1, borderRadius: 'var(--mantine-radius-md)' }}>
                <Stack gap={4} align="center">
                  <IconUser size={24} color={activeTab === 'perfil' ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)'} stroke={activeTab === 'perfil' ? 2.5 : 1.5} />
                  <Text size="xs" fw={700} c={activeTab === 'perfil' ? 'teal' : 'dimmed'}>Perfil</Text>
                </Stack>
              </UnstyledButton>
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
