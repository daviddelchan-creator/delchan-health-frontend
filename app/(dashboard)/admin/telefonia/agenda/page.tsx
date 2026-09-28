"use client";

import { Title, Text, Card, Group, Button, Table, Badge, Stack } from '@mantine/core';
import { IconCalendar, IconRefresh, IconVideo } from '@tabler/icons-react';

export default function AgendaPage() {
  const syncCalendar = () => {
    fetch('/api/calendar/sync', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert("Sincronização concluída. 3 eventos processados.");
      });
  };

  const meetings = [
    { id: 1, time: '09:00', patient: 'Maria Perez', type: 'Presencial', status: 'Confirmado' },
    { id: 2, time: '10:30', patient: 'João Silva', type: 'Telemedicina (Webex)', status: 'Aguardando' },
    { id: 3, time: '14:00', patient: 'Ana Costa', type: 'Telemedicina (Zoom)', status: 'Confirmado' }
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Agenda Sincronizada (UC)</Title>
          <Text c="dimmed">Visualize e sincronize consultas com os provedores de Unified Communications (Cisco, Zoom, Teams, etc).</Text>
        </div>
        <Button leftSection={<IconRefresh size={16} />} color="#0FB5A0" onClick={syncCalendar}>
          Sincronizar Calendários
        </Button>
      </Group>

      <Card withBorder shadow="sm" radius="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Horário</Table.Th>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Tipo de Consulta</Table.Th>
              <Table.Th>Status UC</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {meetings.map((m) => (
              <Table.Tr key={m.id}>
                <Table.Td fw={500}>{m.time}</Table.Td>
                <Table.Td>{m.patient}</Table.Td>
                <Table.Td>
                  {m.type.includes('Telemedicina') ? (
                    <Group gap="xs">
                      <IconVideo size={16} color="gray" />
                      <Text size="sm">{m.type}</Text>
                    </Group>
                  ) : (
                    <Text size="sm">{m.type}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge color={m.status === 'Confirmado' ? 'teal' : 'yellow'}>{m.status}</Badge>
                </Table.Td>
                <Table.Td>
                  {m.type.includes('Telemedicina') && (
                    <Button variant="light" size="xs">Entrar na Sala</Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
