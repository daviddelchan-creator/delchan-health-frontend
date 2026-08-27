"use client";

import { Title, Card, Text } from '@mantine/core';
import { AppointmentCalendar } from '../../../../components/AppointmentCalendar';
import { useMedplum } from '@medplum/react';

export default function DoctorAgendaPage() {
  const medplum = useMedplum();

  return (
    <>
      <Title order={2} c="slate.9" fw={700} mb="lg">Minha Agenda Clínica</Title>
      <Card p="xl" shadow="sm" radius="md" withBorder style={{ borderColor: '#e2e8f0' }}>
        <Text c="dimmed" mb="md">Gerencie seus horários e salas de atendimento.</Text>
        <AppointmentCalendar medplum={medplum} />
      </Card>
    </>
  );
}