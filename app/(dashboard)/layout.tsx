"use client";

import { AppShell, Group, Avatar, Text, UnstyledButton, Stack, Badge, Card, Center, Box, Button, Drawer } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReactNode, useEffect, useState, Suspense } from 'react';
import { useMedplumProfile } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';
import { DoctorProfile } from '../../components/profile/DoctorProfile';

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useMedplumProfile();
  const { tenantConfig } = useTenant();
  
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAdmin = pathname?.startsWith('/admin');
  const isDoctor = pathname?.startsWith('/doctor');
  
  const activeAdminTab = searchParams.get('tab') || 'overview';

  if (!mounted) return null;

  return (
    <AppShell header={isDoctor ? { height: 70 } : undefined} navbar={isAdmin ? { width: 260, breakpoint: 'sm' } : undefined} padding={0} bg="#f8f9fa">
      
      {/* HEADER DEL MÉDICO CON EL NUEVO BOTÓN "CRM" */}
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
                {/* NUEVO BOTÓN CRM */}
                <UnstyledButton onClick={() => router.push('/doctor/crm')} px="md" py="xs" bg={pathname?.includes('/crm') ? 'dark.9' : 'transparent'} c={pathname?.includes('/crm') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>CRM</UnstyledButton>
              </Group>
            </Group>
            <Group>
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

      {isAdmin && (
        <AppShell.Navbar p="md" style={{ borderRight: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Group mb="xl" px="xs" wrap="nowrap">
            <Center bg="dark.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
            <div>
              <Text fw={900} size="lg" style={{ letterSpacing: '-0.5px' }} c="dark.9">Delchan</Text>
              <Text size="xs" c="teal.6" fw={700} style={{ marginTop: '-4px' }}>HEALTH OS</Text>
            </div>
            <Badge color="teal" variant="light" size="xs" radius="sm">GOD MODE</Badge>
          </Group>

          <Text size="xs" fw={700} c="dimmed" mb="sm" px="xs" lts={1}>SUPER ADMIN</Text>
          <Stack gap="xs">
            <UnstyledButton onClick={() => router.push('/admin?tab=overview')} p="sm" bg={activeAdminTab === 'overview' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'overview' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 600 }}>Dashboard</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=tenants')} p="sm" bg={activeAdminTab === 'tenants' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'tenants' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Clínicas / Tenants</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=modules')} p="sm" bg={activeAdminTab === 'modules' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'modules' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Módulos SaaS</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=whitelabel')} p="sm" bg={activeAdminTab === 'whitelabel' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'whitelabel' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>White-Label</UnstyledButton>
            
            <Text size="xs" fw={700} c="dimmed" mt="sm" mb="xs" px="xs" lts={1}>CONFIG. CLÍNICA</Text>
            <UnstyledButton onClick={() => router.push('/admin?tab=clinic')} p="sm" bg={activeAdminTab === 'clinic' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'clinic' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Dados da Clínica</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=security')} p="sm" bg={activeAdminTab === 'security' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'security' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Segurança & Acesso</UnstyledButton>
            
            <Text size="xs" fw={700} c="dimmed" mt="sm" mb="xs" px="xs" lts={1}>ENGENHARIA</Text>
            <UnstyledButton onClick={() => router.push('/admin?tab=layout')} p="sm" bg={activeAdminTab === 'layout' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'layout' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Layout Prontuário</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=builder')} p="sm" bg={activeAdminTab === 'builder' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'builder' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Construtor de Módulos</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin?tab=templates')} p="sm" bg={activeAdminTab === 'templates' ? 'teal.0' : 'transparent'} c={activeAdminTab === 'templates' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Modelos de Evolução</UnstyledButton>
          </Stack>
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>

      <Drawer opened={profileOpen} onClose={() => setProfileOpen(false)} position="right" size="100%" title={<Text fw={900} size="lg">Perfil e Funções CRM</Text>} padding="xl" bg="#f8fafc">
        <DoctorProfile practitioner={profile} onClose={() => setProfileOpen(false)} />
      </Drawer>
    </AppShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}