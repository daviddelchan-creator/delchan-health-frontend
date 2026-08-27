"use client";

import { AppShell, Group, Title, Button, Text, Avatar, Stack, NavLink, MantineProvider, TextInput, ActionIcon } from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useRouter, usePathname } from 'next/navigation';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../../contexts/TenantContext';
// Importamos TenantProvider y useTenantModules para solucionar el error de contexto
import { TenantProvider, useTenantModules } from '../../core/hooks/TenantContext';

function DynamicSidebar({ children }: { children: React.ReactNode }) {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const router = useRouter();
  const pathname = usePathname();
  
  // EXTRAEMOS LA CONFIGURACIÓN MAESTRA DEL MODO DIOS
  const { tenantConfig } = useTenant();
  const { activeModules } = useTenantModules();

  const rolePrefix = pathname.startsWith('/doctor') ? '/doctor' : '/admin';
  const userName = profile?.name?.[0]?.given?.[0] || 'U';

  return (
    <AppShell 
      layout="alt"
      header={{ height: 70 }} 
      navbar={{ width: 260, breakpoint: 'sm' }} 
      padding="xl" 
      bg="#f8fafc" 
    >
      
      {/* SIDEBAR DINÁMICO (WHITE-LABEL) */}
      <AppShell.Navbar bg="white" style={{ borderRight: '1px solid #f1f5f9' }} p="md" zIndex={90}>
        <Group mb="xl" px="xs" mt="xs">
          <Avatar size="md" color={tenantConfig.internalColor} radius="sm">
            {tenantConfig.name.substring(0, 2).toUpperCase()}
          </Avatar>
          <div>
            {/* NOMBRE DE EMPRESA DINÁMICO */}
            <Title order={4} c="dark.9" fw={800}>{tenantConfig.name}</Title>
            <Text size="xs" c="dimmed">Unidade Central</Text>
          </div>
        </Group>

        {/* BOTÓN CON COLOR DINÁMICO */}
        <Button fullWidth color={tenantConfig.internalColor} size="md" radius="md" mb="xl">
          + Nova Consulta
        </Button>

        <Stack gap="xs">
          <NavLink 
            label="📊 Painel" 
            active={pathname === rolePrefix} 
            onClick={() => router.push(rolePrefix)} 
            fw={600} 
            variant="filled"
            color={tenantConfig.internalColor}
            style={{ borderRadius: '8px' }}
          />

          {activeModules.includes('agenda') && (
            <NavLink label="📅 Agenda" active={pathname.includes(`${rolePrefix}/agenda`)} onClick={() => router.push(`${rolePrefix}/agenda`)} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
          )}
          
          {activeModules.includes('clinical') && (
            <NavLink label="📋 Prontuários Clínicos" active={pathname.includes(`${rolePrefix}/clinical`)} onClick={() => router.push(`${rolePrefix}/clinical`)} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
          )}

          {activeModules.includes('crm') && (
            <NavLink label="🤝 CRM Clientes" active={pathname.includes(`${rolePrefix}/crm`)} onClick={() => router.push(`${rolePrefix}/crm`)} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
          )}

          {activeModules.includes('billing') && (
            <NavLink label="💳 Faturamento / PDV" active={pathname.includes(`${rolePrefix}/billing`)} onClick={() => router.push(`${rolePrefix}/billing`)} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
          )}

          {/* VISTAS EXCLUSIVAS DEL ADMIN */}
          {rolePrefix === '/admin' && (
            <>
              <Text fw={700} size="xs" c="dimmed" px="xs" mt="xl" mb="xs" tt="uppercase">Administração</Text>
              <NavLink label="⚙️ Configurações" active={pathname.includes('/admin/configuracao')} onClick={() => router.push('/admin/configuracao')} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
            </>
          )}

          {/* VISTAS EXCLUSIVAS DEL DOCTOR / ESPECIALISTA */}
          {rolePrefix === '/doctor' && (
            <>
              <Text fw={700} size="xs" c="dimmed" px="xs" mt="xl" mb="xs" tt="uppercase">Meu Perfil</Text>
              <NavLink label="🔐 Certificado Digital (A1)" active={pathname.includes('/doctor/configuracao')} onClick={() => router.push('/doctor/configuracao')} fw={600} variant="filled" color={tenantConfig.internalColor} style={{ borderRadius: '8px' }} />
            </>
          )}
        </Stack>
      </AppShell.Navbar>

      {/* HEADER SUPERIOR */}
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
              <Avatar color={tenantConfig.internalColor} radius="xl" size="md">{userName.charAt(0)}</Avatar>
              <div>
                <Text size="sm" fw={700} c="dark.9">{rolePrefix === '/doctor' ? 'Dr. ' : ''}{userName}</Text>
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
    <MantineProvider theme={{
      primaryColor: 'teal',
      defaultRadius: 'md',
      components: {
        Button: { defaultProps: { fw: 600 } },
        Card: { defaultProps: { shadow: 'xs', withBorder: true }, styles: { root: { borderColor: '#f1f5f9' } } }
      }
    }}>
      {/* DEVOLVEMOS EL PROVIDER AQUÍ PARA QUE USETENANTMODULES FUNCIONE */}
      <TenantProvider>
        <DynamicSidebar>{children}</DynamicSidebar>
      </TenantProvider>
    </MantineProvider>
  );
}