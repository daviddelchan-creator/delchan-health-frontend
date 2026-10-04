import React, { useState } from 'react';
import { AppShell, Burger, Group, Text, Avatar, UnstyledButton, Center, Menu, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { Patient } from '@medplum/fhirtypes';
import { PatientSidebar } from './PatientSidebar';

interface PatientAppShellProps {
  children: React.ReactNode;
  profile: Patient | null;
  onLogout: () => void;
}

export function PatientAppShell({ children, profile, onLogout }: PatientAppShellProps) {
  const [opened, { toggle }] = useDisclosure();

  // Responsive sidebar collapse for tablet/desktop is handled locally for the patient context
  // maintaining design system tokens but an isolated navigation tree.
  const [collapsed, setCollapsed] = useState(false);

  const patientName = profile?.name?.[0]?.given?.join(' ') || 'Paciente';
  const patientInitial = patientName.charAt(0).toUpperCase();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: collapsed ? 80 : 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      bg="var(--mantine-color-application)"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" bg="surface">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Center bg="teal.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
            <Text component="div" fw={800} size="xl" c="dark.9" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Delchan Health
            </Text>
          </Group>

          <Group>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar color="teal" radius="xl" size="sm" style={{ cursor: 'pointer' }}>
                      {patientInitial}
                    </Avatar>
                    <Text size="sm" fw={600} visibleFrom="sm">{patientName}</Text>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Sua Conta</Menu.Label>
                <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
                  Meu Perfil
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                  onClick={onLogout}
                >
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <PatientSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} onMobileItemClick={toggle} />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
