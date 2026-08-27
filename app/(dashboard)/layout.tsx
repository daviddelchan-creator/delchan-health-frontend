"use client";

import { AppShell, Group, Title, Button, Text, Avatar, Stack, NavLink, MantineProvider, TextInput, ActionIcon } from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useRouter, usePathname } from 'next/navigation';
import { TenantProvider, useTenantModules } from '../../core/hooks/TenantContext';

// Tema Luminoso "Google Stitch" (Turquesa/Menta y Blanco)
const stitchTheme = {
  primaryColor: 'teal',
  defaultRadius: 'md',
  components: {
    Button: { defaultProps: { fw: 600 } },
    Card: { defaultProps: { shadow: 'xs', withBorder: true }, styles: { root: { borderColor: '#f1f5f9' } } }
  }
};

function DynamicSidebar({ children }: { children: React.ReactNode }) {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { activeModules } = useTenantModules();

  const rolePrefix = pathname.startsWith('/doctor') ? '/doctor' : '/admin';
  const userName = profile?.name?.[0]?.given?.[0] || 'U';

  return (
    <AppShell 
      layout="alt" // 🚨 CLAVE: Esto hace que el menú lateral llegue hasta arriba
      header={{ height: 70 }} 
      navbar={{ width: 260, breakpoint: 'sm' }} 
      padding="xl" 
      bg="#f8fafc" // Fondo gris ultra claro de la captura
    >
      
      {/* SIDEBAR BLANCO (Llega hasta arriba) */}
      <AppShell.Navbar bg="white" style={{ borderRight: '1px solid #f1f5f9' }} p="md" zIndex={90}>
        <Group mb="xl" px="xs" mt="xs">
          <Avatar src="/logo.png" size="md" color="teal" radius="sm">DH</Avatar>
          <div>
            <Title order={4} c="dark.9" fw={800}>MiSalud ERP</Title>
            <Text size="xs" c="dimmed">Unidade Central</Text>
          </div>
        </Group>

        <Button fullWidth color="teal" size="md" radius="md" mb="xl">
          + Nova Consulta
        </Button>

        <Stack gap="xs">
          <NavLink 
            label="📊 Painel" 
            active={pathname === rolePrefix} 
            onClick={() => router.push(rolePrefix)} 
            fw={600} 
            variant="filled"
            color="teal"
            style={{ borderRadius: '8px' }}
          />

          {activeModules.includes('agenda') && (
            <NavLink label="📅 Agenda" active={pathname.includes(`${rolePrefix}/agenda`)} onClick={() => router.push(`${rolePrefix}/agenda`)} fw={600} style={{ borderRadius: '8px' }} />
          )}
          
          {activeModules.includes('clinical') && (
            <NavLink label="📋 Prontuários Clínicos" active={pathname.includes(`${rolePrefix}/clinical`)} onClick={() => router.push(`${rolePrefix}/clinical`)} fw={600} style={{ borderRadius: '8px' }} />
          )}

          {activeModules.includes('crm') && (
            <NavLink label="🤝 CRM Clientes" active={pathname.includes(`${rolePrefix}/crm`)} onClick={() => router.push(`${rolePrefix}/crm`)} fw={600} style={{ borderRadius: '8px' }} />
          )}

          {activeModules.includes('billing') && (
            <NavLink label="💳 Faturamento / PDV" active={pathname.includes(`${rolePrefix}/billing`)} onClick={() => router.push(`${rolePrefix}/billing`)} fw={600} style={{ borderRadius: '8px' }} />
          )}

          {rolePrefix === '/admin' && (
            <>
              <Text fw={700} size="xs" c="dimmed" px="xs" mt="xl" mb="xs" tt="uppercase">Administração</Text>
              <NavLink label="⚙️ Configurações" active={pathname.includes('/admin/configuracao')} onClick={() => router.push('/admin/configuracao')} fw={600} style={{ borderRadius: '8px' }} />
            </>
          )}
        </Stack>
      </AppShell.Navbar>

      {/* HEADER BLANCO (Barra de búsqueda y perfil) */}
      <AppShell.Header bg="white" style={{ borderBottom: '1px solid #f1f5f9' }} zIndex={100}>
        <Group h="100%" px="xl" justify="space-between">
          <TextInput 
            placeholder="🔍 Buscar pacientes, prontuários..." 
            w={400} 
            radius="md"
            styles={{ input: { backgroundColor: '#f8fafc', border: 'none' } }}
          />
          <Group gap="lg">
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">🔔</ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">⏱️</ActionIcon>
            <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => { medplum.signOut(); router.push('/'); }}>
              <Avatar color="teal" radius="xl" size="md">{userName.charAt(0)}</Avatar>
              <div>
                <Text size="sm" fw={700} c="dark.9">Dr. {userName}</Text>
                <Text size="xs" c="dimmed">Sair do sistema</Text>
              </div>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={stitchTheme}>
      <TenantProvider>
        <DynamicSidebar>{children}</DynamicSidebar>
      </TenantProvider>
    </MantineProvider>
  );
}