"use client";

import { Title, Text, Card, Stack, Button, Badge, Group, ThemeIcon, Grid, ActionIcon } from '@mantine/core';
import { usePatientDashboardContext } from './state/PatientDashboardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconCalendarEvent, IconClipboardList, IconFolder, IconHeartbeat, IconUser, IconCheck, IconFileDescription, IconPill, IconActivity } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function PatientDashboardPage() {
  const { state, data, error } = usePatientDashboardContext();
  const router = useRouter();

  if (state === 'ERROR') {
     return <ErrorState message={error?.message || "Ocorreu um erro ao carregar o painel."} />;
  }

  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      return null; // Handled by layout
  }

  const profile = data?.profile;
  const firstName = profile?.name?.[0]?.given?.[0] || 'Paciente';

  const nextAppointment = data?.appointments?.find(a => a.status === 'booked' || a.status === 'arrived');

  // Extract practitioner from nextAppointment participant if available
  let practitionerName = null;
  if (nextAppointment && nextAppointment.participant) {
    const practitioner = nextAppointment.participant.find(p => p.actor?.reference?.startsWith('Practitioner/'));
    if (practitioner && practitioner.actor?.display) {
      practitionerName = practitioner.actor.display;
    }
  }

  const quickActions = [
    { icon: <IconCalendarEvent size={24} />, label: 'Consultas', path: '/patient/consultas' },
    { icon: <IconClipboardList size={24} />, label: 'Histórico', path: '/patient/historico' },
    { icon: <IconFolder size={24} />, label: 'Documentos', path: '/patient/documentos' },
    { icon: <IconHeartbeat size={24} />, label: 'Saúde', path: '/patient/saude' },
    { icon: <IconUser size={24} />, label: 'Perfil', path: '/patient/perfil' },
  ];

  return (
    <Stack gap="lg" pb="xl">
      <div>
        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Bem-vindo de volta,</Text>
        <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
          {firstName}
        </Title>
      </div>

      {nextAppointment ? (
        <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder>
          <Group justify="space-between" mb="sm">
            <Badge color="blue" variant="light" size="sm" fw={700}>Próxima Consulta</Badge>
            <Text size="xs" c="dimmed" fw={600}>
                {nextAppointment.start ? new Date(nextAppointment.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data a definir'}
            </Text>
          </Group>
          <Title order={4} c="dark.9" fw={800}>{nextAppointment.description || 'Avaliação Clínica'}</Title>
          {practitionerName && (
            <Text size="sm" c="dimmed" mb="lg">
                {practitionerName}
            </Text>
          )}

          <Group grow mt="lg">
            <Button variant="outline" color="dark.8" radius="xl" onClick={() => router.push('/patient/consultas')}>Ver consultas</Button>
          </Group>
        </Card>
      ) : (
          <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder>
            <Group wrap="nowrap" justify="space-between" align="center">
              <Group wrap="nowrap">
                <ThemeIcon size="lg" radius="xl" color="teal.6">
                  <IconCheck size={20} stroke={2.5} />
                </ThemeIcon>
                <div>
                  <Text fw={700} c="teal.9">Tudo em dia</Text>
                  <Text size="xs" c="teal.8">Você não possui consultas agendadas no momento.</Text>
                </div>
              </Group>
              <Button variant="subtle" color="teal" size="xs" onClick={() => router.push('/patient/consultas')}>
                Ver agenda
              </Button>
            </Group>
          </Card>
      )}

      <div>
        <Text size="sm" fw={700} c="dark.9" mb="md">Ações Rápidas</Text>
        <Grid gutter="sm">
          {quickActions.map((item, i) => (
            <Grid.Col span={{ base: 4, xs: 3, sm: 2 }} key={i}>
              <Stack gap="xs" align="center" style={{ cursor: 'pointer' }} onClick={() => router.push(item.path)}>
                <ActionIcon size="xl" radius="xl" variant="light" color="teal" style={{ width: 56, height: 56 }}>
                  {item.icon}
                </ActionIcon>
                <Text size="xs" fw={600} c="dark.8" ta="center">{item.label}</Text>
              </Stack>
            </Grid.Col>
          ))}
        </Grid>
      </div>

      {state === 'EMPTY' ? (
         <EmptyState
            title="Histórico limpo"
            description="Você ainda não possui documentos, medicamentos ou resultados de exames em seu histórico."
         />
      ) : (
         <div>
            <Text size="sm" fw={700} c="dark.9" mb="md">Resumo de Saúde</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card p="md" radius="lg" withBorder shadow="none" onClick={() => router.push('/patient/documentos')} style={{ cursor: 'pointer' }}>
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                      <IconFolder size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm">Documentos</Text>
                      <Text size="xs" c="dimmed">
                        {data?.documents?.length ? `${data.documents.length} documento${data.documents.length > 1 ? 's' : ''} disponíve${data.documents.length > 1 ? 'is' : 'l'}` : 'Nenhum documento'}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card p="md" radius="lg" withBorder shadow="none" onClick={() => router.push('/patient/saude')} style={{ cursor: 'pointer' }}>
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                      <IconPill size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm">Medicamentos</Text>
                      <Text size="xs" c="dimmed">
                        {data?.medications?.length ? `${data.medications.length} medicamento${data.medications.length > 1 ? 's' : ''}` : 'Nenhum medicamento'}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card p="md" radius="lg" withBorder shadow="none" onClick={() => router.push('/patient/historico')} style={{ cursor: 'pointer' }}>
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                      <IconFileDescription size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm">Resultados</Text>
                      <Text size="xs" c="dimmed">
                        {data?.diagnostics?.length ? `${data.diagnostics.length} resultado${data.diagnostics.length > 1 ? 's' : ''}` : 'Nenhum resultado'}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card p="md" radius="lg" withBorder shadow="none" onClick={() => router.push('/patient/saude')} style={{ cursor: 'pointer' }}>
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                      <IconActivity size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm">Observações</Text>
                      <Text size="xs" c="dimmed">
                        {data?.observations?.length ? `${data.observations.length} registro${data.observations.length > 1 ? 's' : ''}` : 'Nenhum registro'}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
         </div>
      )}
    </Stack>
  );
}
