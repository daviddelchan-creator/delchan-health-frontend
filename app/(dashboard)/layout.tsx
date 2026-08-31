"use client";

import { AppShell, Group, Avatar, Text, UnstyledButton, Stack, Badge, Card, Center, Box, Button } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useMedplumProfile } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useMedplumProfile();
  const { tenantConfig } = useTenant();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAdmin = pathname?.startsWith('/admin');
  const isDoctor = pathname?.startsWith('/doctor');
  
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  if (!mounted) return null;

  return (
    <AppShell
      header={isDoctor ? { height: 70 } : undefined}
      navbar={isAdmin ? { width: 260, breakpoint: 'sm' } : undefined}
      padding={0}
      bg="#f8f9fa"
    >
      {/* 1. NAVEGACIÓN SUPERIOR PARA EL MÉDICO (DOCTOR PROFILE) */}
      {isDoctor && (
        <AppShell.Header style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group>
              <Center bg="teal.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
              
              {/* CORRECCIÓN DE HIDRATACIÓN: component="div" evita que el Badge rompa el HTML */}
              <Text component="div" fw={800} size="xl" c="dark.9" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Delchan <Badge size="sm" variant="light" color="gray">OS</Badge>
              </Text>
              
              <Group ml="xl" gap="sm">
                <UnstyledButton onClick={() => router.push('/doctor')} px="md" py="xs" bg={pathname === '/doctor' ? 'dark.9' : 'transparent'} c={pathname === '/doctor' ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Início</UnstyledButton>
                <UnstyledButton onClick={() => router.push('/doctor/pacientes')} px="md" py="xs" bg={pathname?.includes('/pacientes') ? 'dark.9' : 'transparent'} c={pathname?.includes('/pacientes') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Pacientes</UnstyledButton>
                <UnstyledButton onClick={() => router.push('/doctor/agenda')} px="md" py="xs" bg={pathname?.includes('/agenda') ? 'dark.9' : 'transparent'} c={pathname?.includes('/agenda') ? 'white' : '#64748b'} style={{ borderRadius: 20, fontWeight: 600 }}>Agenda</UnstyledButton>
              </Group>
            </Group>
            <Group>
              <Button color="teal.9" radius="xl" onClick={() => router.push('/doctor/pacientes/novo')}>+ Novo Registro</Button>
              <Avatar color="dark" radius="xl">DR</Avatar>
            </Group>
          </Group>
        </AppShell.Header>
      )}

      {/* 2. BARRA LATERAL PARA EL SUPER ADMIN (GOD MODE) */}
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
            <UnstyledButton onClick={() => router.push('/admin')} p="sm" bg={pathname === '/admin' ? 'teal.0' : 'transparent'} c={pathname === '/admin' ? 'teal.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 600, borderLeft: pathname === '/admin' ? '3px solid #0d9488' : 'none' }}>
              Dashboard
            </UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/tenants')} p="sm" c={pathname?.includes('/tenants') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Clínicas / Tenants</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/modulos')} p="sm" c={pathname?.includes('/modulos') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Módulos SaaS</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/whitelabel')} p="sm" c={pathname?.includes('/whitelabel') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>White-Label</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/seguranca')} p="sm" c={pathname?.includes('/seguranca') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Segurança & Acesso</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/prontuario')} p="sm" c={pathname?.includes('/prontuario') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Layout Prontuário</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/construtor')} p="sm" c={pathname?.includes('/construtor') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Construtor de Módulos</UnstyledButton>
            <UnstyledButton onClick={() => router.push('/admin/plantillas')} p="sm" c={pathname?.includes('/plantillas') ? 'dark.9' : 'gray.7'} style={{ borderRadius: 8, fontWeight: 500 }}>Plantillas</UnstyledButton>
          </Stack>

          <Box mt="auto">
            <Card p="md" radius="md" bg="teal.0">
              <Text fw={700} size="sm" c="teal.9">Modo Deus ativo</Text>
              <Text size="xs" c="teal.7" mt={4}>Você está editando a Instância global. Alterações afetam todos os tenants.</Text>
              <Group mt="md" gap={5}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0d9488' }} />
                <Text size="xs" c="teal.7" fw={600}>Auditoria ligada</Text>
              </Group>
            </Card>
          </Box>
        </AppShell.Navbar>
      )}

      {/* ÁREA PRINCIPAL DONDE SE CARGAN LAS PÁGINAS */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}