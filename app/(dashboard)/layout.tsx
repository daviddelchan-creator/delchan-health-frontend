"use client";

import { AppShell, Group, Button, Avatar, Title, Text, ActionIcon } from '@mantine/core';
import { useMedplumProfile } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = useMedplumProfile();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig.internalColor || '#0d9488';

  return (
    <AppShell
      header={{ height: 72 }}
      padding="0"
      style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
    >
      <AppShell.Header style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Group h="100%" px="xl" justify="space-between">
          <Group gap="md">
            <Avatar size={40} radius="xl" style={{ backgroundColor: primaryColor, color: '#fff', fontWeight: 800 }}>
              DE
            </Avatar>
            <Title order={4} fw={800} c="dark.9">
              Delchan <Text span c="dimmed" fw={400} size="sm">OS</Text>
            </Title>
            
            <Group ml="xl" gap="sm" visibleFrom="sm">
              <Button variant="subtle" color="gray" radius="xl">Início</Button>
              <Button variant="filled" color="dark" radius="xl" style={{ backgroundColor: '#111827' }}>Pacientes</Button>
              <Button variant="subtle" color="gray" radius="xl">Agenda</Button>
              <Button variant="subtle" color="gray" radius="xl">Financeiro</Button>
            </Group>
          </Group>

          <Group gap="md">
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">🔔</ActionIcon>
            <Group gap="sm" style={{ cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <Text size="sm" fw={700} c="dark.9">{profile?.name?.[0]?.text || 'Dr. Medplum'}</Text>
                <Text size="xs" c="dimmed">Especialista</Text>
              </div>
              <Avatar radius="xl" color="teal">{profile?.name?.[0]?.given?.[0] || 'M'}</Avatar>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* El contenido de todas las páginas (doctor, admin, profile) se renderiza aquí */}
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px' }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}