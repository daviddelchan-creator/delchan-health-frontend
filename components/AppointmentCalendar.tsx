"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, Title, Text, Button, Stack, Group, Select, TextInput, Badge, Divider, Table } from '@mantine/core';

export function AppointmentCalendar({ medplum }: { medplum: any }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingTeams, setIsSyncingTeams] = useState(false);
  const [roomType, setRoomType] = useState('Sala de Procedimientos 1 (Teams / Samsung Business)');
  const [calendarEmail, setCalendarEmail] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      const bundle = await medplum.search('Appointment', '_sort=-_lastUpdated');
      const aptList = bundle.entry?.map((e: any) => e.resource) || [];
      setAppointments(aptList);
    } catch (error) {
      console.error("Error al cargar citas:", error);
    }
  }, [medplum]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Simulación de sincronización con Google Calendar u Office 365
  const handleSyncCalendar = (provider: 'google' | 'teams') => {
    if (provider === 'google') {
      setIsSyncingGoogle(true);
      setTimeout(() => {
        alert('✅ Conexión exitosa con Google Calendar. Los eventos de la clínica se sincronizarán en tiempo real.');
        setIsSyncingGoogle(false);
      }, 1200);
    } else {
      setIsSyncingTeams(true);
      setTimeout(() => {
        alert(`✅ Recurso de sala vinculado correctamente con Microsoft Teams y pantallas Samsung Business (${roomType}).`);
        setIsSyncingTeams(false);
      }, 1200);
    }
  };

  return (
    <Stack>
      {/* SECCIÓN DE CONFIGURACIÓN DE CALENDARIOS Y SALAS */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md" c="teal">Sincronización de Agenda y Salas (Enterprise)</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Conecte el calendario del especialista con plataformas externas o configure salas inteligentes compatibles con sistemas de reserva corporativos.
        </Text>

        <Group grow align="flex-end">
          <TextInput
            label="Correo del Médico / Especialista"
            placeholder="medico@clinica.com.br"
            value={calendarEmail}
            onChange={(e) => setCalendarEmail(e.currentTarget.value)}
          />
          <Button color="blue" onClick={() => handleSyncCalendar('google')} loading={isSyncingGoogle}>
            Sincronizar con Google Calendar
          </Button>
          <Button color="indigo" onClick={() => handleSyncCalendar('google')} loading={isSyncingGoogle}>
            Sincronizar con Office 365
          </Button>
        </Group>

        <Divider my="lg" />

        <Title order={5} mb="sm">Gestión de Salas y Pantallas (Samsung Business / Teams)</Title>
        <Group grow align="flex-end">
          <Select
            label="Sala de la Clínica / Consultorio"
            data={[
              { value: 'Sala de Procedimientos 1 (Teams / Samsung Business)', label: 'Sala de Procedimientos 1 (Teams / Samsung Business)' },
              { value: 'Consultorio VIP Estética (Google Meet Hardware)', label: 'Consultorio VIP Estética (Google Meet Hardware)' },
              { value: 'Sala de Juntas Ejecutiva', label: 'Sala de Juntas Ejecutiva' }
            ]}
            value={roomType}
            onChange={(val) => setRoomType(val || '')}
          />
          <Button color="teal" onClick={() => handleSyncCalendar('teams')} loading={isSyncingTeams}>
            Vincular Recurso de Sala
          </Button>
        </Group>
      </Card>

      {/* LISTADO DE CITAS ACTIVAS */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">Citas y Turnos Agendados en el Servidor FHIR</Title>
        {appointments.length === 0 ? (
          <Text size="sm" c="dimmed">No hay citas registradas en la agenda actualmente.</Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID Cita</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th>Fecha y Hora</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointments.map((apt: any) => (
                <Table.Tr key={apt.id}>
                  <Table.Td>{apt.id?.slice(0, 8)}</Table.Td>
                  <Table.Td fw={500}>{apt.description || 'Consulta Estética'}</Table.Td>
                  <Table.Td>{apt.start ? new Date(apt.start).toLocaleString() : 'N/A'}</Table.Td>
                  <Table.Td><Badge color="blue">{apt.status}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}