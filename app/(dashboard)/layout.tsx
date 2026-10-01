"use client";

import { AppShell, Group, Avatar, Text, UnstyledButton, Stack, Badge, Center, Button, Drawer } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { useTenant } from '@/contexts/TenantContext';
import { DoctorProfile } from '@/components/profile/DoctorProfile';
import { GodModeSidebar } from '@/components/admin/GodModeSidebar';
import { PatientWorkspace } from '@/components/patient/PatientWorkspace';
import { ClinicalEditor } from '@/components/clinical/ClinicalEditor';
import { Patient } from '@medplum/fhirtypes';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const { tenantConfig } = useTenant();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  // Default to a null patient, but in a real flow this would be set by a global context or props.
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const isAdmin = pathname?.startsWith('/admin');
  const isDoctor = pathname?.startsWith('/doctor') || pathname === '/';

  return (
    <AppShell 
      header={isDoctor ? { height: 70 } : undefined} 
      navbar={isAdmin ? { width: 260, breakpoint: 'sm' } : undefined} 
      padding={0} 
      bg="#f8f9fa"
    >
      
      {/* HEADER DO MÉDICO / DASHBOARD */}
      {isDoctor && (
        <AppShell.Header style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group>
              <Center bg="teal.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
              <Text component="div" fw={800} size="xl" c="dark.9" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Delchan <Badge size="sm" variant="light" color="gray">OS</Badge>
              </Text>
              <Group ml="xl" gap="sm">
                <UnstyledButton onClick={() => router.push('/doctor')} px="md" py="xs" bg={pathname === '/doctor' ? 'dark.9' : 'transparent'} c={pathname === '/doctor' ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Início</UnstyledButton>
                <UnstyledButton onClick={() => router.push('/doctor/pacientes')} px="md" py="xs" bg={pathname?.includes('/pacientes') ? 'dark.9' : 'transparent'} c={pathname?.includes('/pacientes') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Pacientes</UnstyledButton>
                <UnstyledButton onClick={() => router.push('/doctor/agenda')} px="md" py="xs" bg={pathname?.includes('/agenda') ? 'dark.9' : 'transparent'} c={pathname?.includes('/agenda') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Agenda</UnstyledButton>
                <UnstyledButton onClick={() => router.push('/doctor/crm')} px="md" py="xs" bg={pathname?.includes('/crm') ? 'dark.9' : 'transparent'} c={pathname?.includes('/crm') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>CRM</UnstyledButton>
              </Group>
            </Group>
            <Group>
              {/* Vínculo del workspace clínico global */}
              <Button color="teal.9" variant="light" radius="xl" onClick={() => setWorkspaceOpen(true)}>Abrir Clinical Workspace</Button>
              <Button color="teal.9" radius="xl" onClick={() => router.push('/doctor/pacientes/novo')}>+ Novo Registro</Button>
              <UnstyledButton onClick={() => setProfileOpen(true)}>
                <Avatar color="dark" radius="xl" style={{ cursor: 'pointer' }}>
                  {profile?.name?.[0]?.given?.[0] || 'DR'}
                </Avatar>
              </UnstyledButton>
            </Group>
          </Group>
        </AppShell.Header>
      )}

      {/* SIDEBAR DO SUPER ADMIN */}
      {isAdmin && (
        <AppShell.Navbar p="md" style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <GodModeSidebar />
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>

      <Drawer opened={profileOpen} onClose={() => setProfileOpen(false)} position="right" size="100%" title="Perfil e Funções CRM" padding="xl" bg="#f8fafc">
        <DoctorProfile practitioner={profile as any} onClose={() => setProfileOpen(false)} />
      </Drawer>

      <Drawer
        opened={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        position="right"
        size="100%"
        padding={0}
        withCloseButton={false}
      >
        {selectedPatient ? (
          <PatientWorkspace
            patient={selectedPatient}
            medplum={medplum}
            doctorName={profile?.name?.[0]?.given?.[0] || 'Médico'}
            onClose={() => setWorkspaceOpen(false)}
          />
        ) : (
          <Center h="100vh">
             <Stack align="center">
                <Text fw={500} size="lg">Selecione um paciente para abrir o Workspace Clínico Completo.</Text>
                {/* Embedded ClinicalEditor default form when no patient is set, fulfilling instruction directly */}
                <ClinicalEditor onSave={() => {}} />
                <Button color="teal.9" onClick={() => setWorkspaceOpen(false)}>Fechar Workspace</Button>
             </Stack>
          </Center>
        )}
      </Drawer>
    </AppShell>
  );
}
