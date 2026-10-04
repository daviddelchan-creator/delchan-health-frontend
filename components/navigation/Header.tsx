import React, { useState } from 'react';
import { Group, Text, Avatar, UnstyledButton, Badge, Center, Drawer, Button } from '@mantine/core';
import { useMedplumProfile } from '@medplum/react-hooks';
import { DoctorProfile } from '../profile/DoctorProfile';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  burger: React.ReactNode;
  isAdmin: boolean;
}

export function Header({ burger, isAdmin }: HeaderProps) {
  const profile = useMedplumProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Group h="100%" px="md" justify="space-between" bg="surface">
        <Group>
          {burger}
          {/* Logo / Organization Context placeholder */}
          <Center bg="teal.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
          <Text component="div" fw={800} size="xl" c="dark.9" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Delchan <Badge size="sm" variant="light" color="gray">OS</Badge>
          </Text>
        </Group>

        <Group>
          {!isAdmin && (
            <Button color="teal.9" radius="xl" onClick={() => router.push('/doctor/pacientes/novo')}>
              + Novo Registro
            </Button>
          )}
          <UnstyledButton onClick={() => setProfileOpen(true)}>
            <Avatar color="dark" radius="xl" style={{ cursor: 'pointer' }}>
              {profile?.name?.[0]?.given?.[0] || (isAdmin ? 'ADM' : 'DR')}
            </Avatar>
          </UnstyledButton>
        </Group>
      </Group>

      <Drawer opened={profileOpen} onClose={() => setProfileOpen(false)} position="right" size="100%" title="Perfil" padding="xl" bg="#f8fafc">
        {/* Only showing practitioner profile if available */}
        <DoctorProfile practitioner={profile} onClose={() => setProfileOpen(false)} />
      </Drawer>
    </>
  );
}
