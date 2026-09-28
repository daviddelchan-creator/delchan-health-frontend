"use client";

import { Card, Table, Badge, Button, Group, Text, Grid, Stack, Modal, Switch } from '@mantine/core';
import { IconPhoneCall, IconClock, IconHeadset, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';

const mockCalls = [
  { id: 1, de: '+55 11 99999-9999', para: 'Recepção (Cisco 9861)', duracao: '02:45', status: 'Ativa', gravacao: 'Sim (LGPD)', transcricao: 'Processando...' },
  { id: 2, de: '+55 11 98888-8888', para: 'Dra. Maria (Webex App)', duracao: '15:20', status: 'Encerrada', gravacao: 'Sim (LGPD)', transcricao: 'Disponível' },
  { id: 3, de: '+55 11 97777-7777', para: 'Fila de Espera', duracao: '01:10', status: 'Em Espera', gravacao: 'Não', transcricao: '-' },
];

export default function GestaoTelefoniaPage() {
  const [compModal, setCompModal] = useState(false);

  const simulateCall = () => {
    fetch('/api/cisco/call/incoming?phone=5511999999999'); // for server mock
    const event = new CustomEvent('cisco-call-incoming', { detail: { phone: '+55 11 99999-9999' } });
    window.dispatchEvent(event);
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Text fw={700} size="xl">Gestão de Telefonia & Comunicação Unificada</Text>
        <Group>
          <Button variant="outline" color="teal" onClick={simulateCall} leftSection={<IconPhoneCall size={16} />}>Simulate Incoming Call</Button>
          <Button color="dark" onClick={() => setCompModal(true)} leftSection={<IconSettings size={16} />}>Compatibilidade</Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="lg" radius="xl" withBorder bg="#0FB5A0" c="white">
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm" style={{ letterSpacing: 1 }}>CHAMADAS HOJE</Text>
              <IconPhoneCall size={20} opacity={0.8} />
            </Group>
            <Text fw={800} size="3xl">1,245</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="lg" radius="xl" withBorder bg="white">
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm" c="dimmed" style={{ letterSpacing: 1 }}>TEMPO MÉDIO</Text>
              <IconClock size={20} color="#0FB5A0" />
            </Group>
            <Text fw={800} size="3xl" c="dark.9">04:12</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="lg" radius="xl" withBorder bg="white">
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm" c="dimmed" style={{ letterSpacing: 1 }}>TAXA DE ATENDIMENTO</Text>
              <IconHeadset size={20} color="#0FB5A0" />
            </Group>
            <Text fw={800} size="3xl" c="dark.9">98.2%</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={700} size="lg" mb="md">Monitoramento em Tempo Real</Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>De</Table.Th>
              <Table.Th>Para</Table.Th>
              <Table.Th>Duração</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Gravação</Table.Th>
              <Table.Th>Transcrição IA</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mockCalls.map(call => (
              <Table.Tr key={call.id}>
                <Table.Td fw={500}>{call.de}</Table.Td>
                <Table.Td>{call.para}</Table.Td>
                <Table.Td>{call.duracao}</Table.Td>
                <Table.Td>
                  <Badge color={call.status === 'Ativa' ? 'teal' : call.status === 'Em Espera' ? 'yellow' : 'gray'}>
                    {call.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{call.gravacao}</Table.Td>
                <Table.Td>{call.transcricao}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={compModal} onClose={() => setCompModal(false)} title="Status de Compatibilidade UC" centered radius="lg">
        <Stack gap="md">
          <Group justify="space-between"><Text>Cisco 9861</Text><Badge color="teal">✓ OK</Badge></Group>
          <Group justify="space-between"><Text>Zoom Phone</Text><Badge color="teal">✓ OK</Badge></Group>
          <Group justify="space-between"><Text>Microsoft Teams</Text><Badge color="teal">✓ OK</Badge></Group>
          <Group justify="space-between"><Text>Avaya via SIP</Text><Badge color="teal">✓ OK</Badge></Group>
          <Group justify="space-between"><Text>Poly</Text><Badge color="teal">✓ OK</Badge></Group>
          <Group justify="space-between"><Text>PoE Switch</Text><Badge color="teal">✓ OK</Badge></Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
