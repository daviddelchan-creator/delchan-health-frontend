"use client";

import { useState, useEffect } from 'react';
import { Affix, Card, Text, Button, Group, Badge, Avatar, Stack, ActionIcon, Transition } from '@mantine/core';
import { IconPhoneIncoming, IconX, IconArrowRight, IconDeviceMobile, IconFileText } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function CallWidget() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [caller, setCaller] = useState({ phone: '', name: '', id: '' });

  useEffect(() => {
    const handleIncomingCall = (event: any) => {
      const { phone } = event.detail;
      // Mock patient lookup
      if (phone.includes('9999')) {
        setCaller({ phone, name: 'MARIA PEREZ', id: 'e0fa8a82' });
      } else {
        setCaller({ phone, name: 'Desconhecido', id: '' });
      }
      setOpened(true);
    };

    window.addEventListener('cisco-call-incoming', handleIncomingCall);
    return () => window.removeEventListener('cisco-call-incoming', handleIncomingCall);
  }, []);

  if (!opened) return null;

  return (
    <Affix position={{ bottom: 20, right: 20 }} zIndex={1000}>
      <Transition transition="slide-up" mounted={opened}>
        {(transitionStyles) => (
          <Card shadow="xl" padding="lg" radius="md" withBorder style={{ ...transitionStyles, width: 350, borderColor: '#0FB5A0', borderTopWidth: 4 }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconPhoneIncoming size={20} color="#0FB5A0" />
                <Text fw={700} size="sm">Chamada Receptiva - Cisco</Text>
              </Group>
              <ActionIcon onClick={() => setOpened(false)} variant="subtle" color="gray">
                <IconX size={16} />
              </ActionIcon>
            </Group>

            <Group wrap="nowrap" mb="md">
              <Avatar color="teal" size="lg">{caller.name ? caller.name.charAt(0) : '?'}</Avatar>
              <div>
                <Text fw={800}>{caller.name}</Text>
                <Text size="xs" c="dimmed">{caller.phone}</Text>
                {caller.id && <Badge size="xs" color="blue" mt={4}>ID: {caller.id}</Badge>}
              </div>
            </Group>

            {caller.id && (
              <Group grow mb="md">
                <Button size="xs" variant="light" color="teal" onClick={() => router.push(`/patient/${caller.id}`)}>Abrir Prontuário</Button>
                <Button size="xs" variant="outline" color="gray" onClick={() => alert("Assinar TCLE")}>Assinar TCLE</Button>
              </Group>
            )}

            <Button variant="default" size="xs" mb="md" fullWidth onClick={() => alert("Dados atualizados!")}>
              Atualizar Dados
            </Button>

            <Stack gap="xs">
              <Button color="#0FB5A0" fullWidth>Atender (Cisco 9861)</Button>
              <Button variant="light" color="blue" fullWidth leftSection={<IconArrowRight size={16} />}>Transferir para consultório</Button>
              <Button variant="light" color="indigo" fullWidth leftSection={<IconDeviceMobile size={16} />}>Desviar para Webex App</Button>
              <Button variant="subtle" color="red" fullWidth leftSection={<IconFileText size={16} />} onClick={() => setOpened(false)}>Encerrar e registrar</Button>
            </Stack>
          </Card>
        )}
      </Transition>
    </Affix>
  );
}
