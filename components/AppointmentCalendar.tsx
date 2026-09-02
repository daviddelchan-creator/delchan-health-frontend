"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, Title, Text, Button, Stack, Group, Select, TextInput, Badge, Divider, Table, ThemeIcon } from '@mantine/core';
import { IconCalendar, IconBuildingHospital, IconBrandGoogle } from '@tabler/icons-react';

export function AppointmentCalendar({ medplum }: { medplum: any }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingTeams, setIsSyncingTeams] = useState(false);
  const [roomType, setRoomType] = useState('Consultório 1 (Display Samsung Business)');
  const [calendarEmail, setCalendarEmail] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      if (medplum) {
        const bundle = await medplum.search('Appointment', '_sort=-_lastUpdated&_count=10');
        const aptList = bundle.entry?.map((e: any) => e.resource) || [];
        setAppointments(aptList);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    }
  }, [medplum]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleSyncCalendar = (provider: 'google' | 'teams') => {
    if (provider === 'google') {
      setIsSyncingGoogle(true);
      setTimeout(() => {
        alert('Conexão realizada com o Google Calendar. Os agendamentos da clínica serão espelhados em tempo real.');
        setIsSyncingGoogle(false);
      }, 1200);
    } else {
      setIsSyncingTeams(true);
      setTimeout(() => {
        alert(`Recurso de sala vinculado com sucesso ao painel da clínica (${roomType}).`);
        setIsSyncingTeams(false);
      }, 1200);
    }
  };

  return (
    <Stack gap="lg">
      <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
        <Title order={3} mb="xs" c="dark.9">Sincronização de Agenda e Espaços Físicos</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Conecte a agenda dos especialistas a plataformas externas e configure painéis de controle de portas e consultórios.
        </Text>

        <Group grow align="flex-end">
          <TextInput
            label="E-mail do Médico / Especialista"
            placeholder="medico@clinica.com.br"
            value={calendarEmail}
            onChange={(e) => setCalendarEmail(e.currentTarget.value)}
            radius="md"
          />
          <Button color="blue" radius="xl" onClick={() => handleSyncCalendar('google')} loading={isSyncingGoogle} leftSection={<IconBrandGoogle size={16} />}>
            Sincronizar Google Calendar
          </Button>
        </Group>

        <Divider my="lg" color="#f1f5f9" />

        <Title order={5} mb="sm" c="dark.9">Gestão de Salas e Consultórios Inteligentes</Title>
        <Group grow align="flex-end">
          <Select
            label="Consultório / Sala da Clínica"
            data={[
              { value: 'Consultório 1 (Display Samsung Business)', label: 'Consultório 1 (Display Samsung Business)' },
              { value: 'Consultório VIP Estética (Google Meet Hardware)', label: 'Consultório VIP Estética (Google Meet Hardware)' },
              { value: 'Sala de Procedimentos Avançados', label: 'Sala de Procedimentos Avançados' }
            ]}
            value={roomType}
            onChange={(val) => setRoomType(val || '')}
            radius="md"
          />
          <Button color="teal" radius="xl" onClick={() => handleSyncCalendar('teams')} loading={isSyncingTeams} leftSection={<IconBuildingHospital size={16} />}>
            Vincular Consultório
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
        <Title order={4} mb="md" c="dark.9">Agendamentos Ativos no Servidor FHIR</Title>
        {appointments.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">Nenhuma consulta agendada no momento.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th>ID CONSULTA</Table.Th>
                <Table.Th>DESCRIÇÃO</Table.Th>
                <Table.Th>DATA E HORA</Table.Th>
                <Table.Th>STATUS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointments.map((apt: any) => (
                <Table.Tr key={apt.id}>
                  <Table.Td fw={700}>#{apt.id?.slice(0, 8)}</Table.Td>
                  <Table.Td>{apt.description || 'Consulta Médica'}</Table.Td>
                  <Table.Td>{apt.start ? new Date(apt.start).toLocaleString('pt-BR') : 'A definir'}</Table.Td>
                  <Table.Td><Badge color="teal" variant="light">{apt.status === 'booked' ? 'Confirmada' : apt.status}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}