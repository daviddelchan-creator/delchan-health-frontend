"use client";

import { Title, Text, Card, Stack, Button, Badge, Group, ThemeIcon, Grid, ActionIcon } from '@mantine/core';
import { usePatientDashboardContext } from './state/PatientDashboardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function PatientDashboardPage() {
  const { state, data, error } = usePatientDashboardContext();

  // If loading or initializing, layout will handle it.
  // Same for UNAUTHORIZED and FORBIDDEN.
  if (state === 'ERROR') {
     return <ErrorState message={error?.message || "Ocorreu um erro ao carregar o painel."} />;
  }

  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      return null; // Handled by layout
  }

  const profile = data?.profile;
  const firstName = profile?.name?.[0]?.given?.[0] || 'Paciente';

  // Find the next appointment
  const nextAppointment = data?.appointments?.find(a => a.status === 'booked' || a.status === 'arrived');

  return (
    <Stack gap="lg">
      <div>
        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Bem-vindo de volta,</Text>
        <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
          {firstName}
        </Title>
      </div>

      {state === 'EMPTY' ? (
         <EmptyState
            title="Nenhum registro encontrado"
            description="Você ainda não possui consultas, documentos ou resultados de exames em seu histórico."
         />
      ) : (
         <>
            {nextAppointment ? (
              <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Group justify="space-between" mb="sm">
                  <Badge color="blue" variant="light" size="sm" fw={700}>Consulta Confirmada</Badge>
                  <Text size="xs" c="dimmed" fw={600}>
                     {nextAppointment.start ? new Date(nextAppointment.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data a definir'}
                  </Text>
                </Group>
                <Title order={4} c="dark.9" fw={800}>{nextAppointment.description || 'Avaliação Clínica'}</Title>
                <Text size="sm" c="dimmed" mb="lg">
                   {/* Normally we'd extract the practitioner from participant list */}
                   Profissional de Saúde
                </Text>

                <Group grow>
                  <Button variant="outline" color="dark.8" radius="xl" disabled>Reagendar (Em breve)</Button>
                </Group>
              </Card>
            ) : (
               <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" radius="xl" color="teal.6">✅</ThemeIcon>
                    <div>
                      <Text fw={700} c="teal.9">Tudo em dia</Text>
                      <Text size="xs" c="teal.8">Você não possui consultas agendadas no momento.</Text>
                    </div>
                  </Group>
               </Card>
            )}

            <Grid gutter="md">
              {[
                { icon: '📅', label: 'Agendar' },
                { icon: '🧪', label: 'Exames' },
                { icon: '💊', label: 'Receitas' },
                { icon: '💳', label: 'Pagamentos' },
              ].map((item, i) => (
                <Grid.Col span={3} key={i}>
                  <Stack gap="xs" align="center" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => alert('Funcionalidade em breve')}>
                    <ActionIcon size="xl" radius="xl" variant="light" color="teal" style={{ width: '60px', height: '60px' }}>
                      <Text size="xl">{item.icon}</Text>
                    </ActionIcon>
                    <Text size="xs" fw={600} c="dark.8">{item.label}</Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
         </>
      )}

    </Stack>
  );
}
