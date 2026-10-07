"use client";

import { useState } from 'react';
import { Stack, Title, Card, Text, Group, Badge, Grid, ThemeIcon, Box, Drawer, UnstyledButton, Button, ActionIcon } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconStethoscope, IconVideo, IconNotes, IconVideoOff, IconMicrophone, IconPhone } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { Appointment } from '@medplum/fhirtypes';
import { StatusBadge, StatusSemanticType } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

// Helper to map FHIR Appointment status to UI Badge
function mapStatus(status: string | undefined): { label: string; semantic: StatusSemanticType } {
  switch (status) {
    case 'booked':
      return { label: 'Agendada', semantic: 'info' };
    case 'arrived':
      return { label: 'Paciente Chegou', semantic: 'warning' };
    case 'fulfilled':
      return { label: 'Realizada', semantic: 'success' };
    case 'cancelled':
      return { label: 'Cancelada', semantic: 'error' };
    case 'noshow':
      return { label: 'Não Compareceu', semantic: 'error' };
    case 'pending':
      return { label: 'Pendente', semantic: 'pending' };
    default:
      return { label: status || 'Desconhecido', semantic: 'neutral' };
  }
}

// Helper to get Practitioner display name safely
function getPractitionerName(appointment: Appointment | null): string {
  if (!appointment || !appointment.participant) return 'Profissional não informado';

  const practitionerParticipant = appointment.participant.find(
    (p) => p.actor?.reference?.startsWith('Practitioner/')
  );

  if (practitionerParticipant && practitionerParticipant.actor?.display) {
    return practitionerParticipant.actor.display;
  }

  return 'Profissional não informado';
}

function isTelemedicine(appointment: Appointment | null): boolean {
  if (!appointment?.appointmentType?.text) return false;
  const typeStr = appointment.appointmentType.text.toLowerCase();
  return typeStr.includes('telemedicina') || typeStr.includes('online') || typeStr.includes('remot') || typeStr.includes('vídeo') || typeStr.includes('video');
}

export default function ConsultasPage() {
  const { state, data } = usePatientDashboardContext();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeWorkspaceApp, setActiveWorkspaceApp] = useState<Appointment | null>(null);

  if (state === 'INITIALIZING' || state === 'LOADING') {
      return <Loading centered minHeight="50vh" />;
  }

  if (state === 'ERROR' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      return null; // Handled by layout
  }

  const allAppointments = data?.appointments || [];

  // Group appointments
  const now = new Date();

  // Future appointments (excluding cancelled)
  const futureAppointments = allAppointments.filter(app => {
     if (!app.start || app.status === 'cancelled') return false;
     const isFuture = new Date(app.start) >= now;
     const isFutureStatus = ['booked', 'pending', 'arrived'].includes(app.status || '');
     return isFuture && isFutureStatus;
  });
  futureAppointments.sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime());

  const nextAppointment = futureAppointments.length > 0 ? futureAppointments[0] : null;
  const otherFutureAppointments = futureAppointments.slice(1);

  // Past appointments
  const pastAppointments = allAppointments.filter(app => {
     if (!app.start || app.status === 'cancelled') return false; // Exclude cancelled from past
     const isPast = new Date(app.start) < now;
     const isPastStatus = ['fulfilled', 'noshow'].includes(app.status || '');
     return isPast || isPastStatus;
  });
  pastAppointments.sort((a, b) => new Date(b.start as string).getTime() - new Date(a.start as string).getTime()); // descending

  // Cancelled appointments
  const cancelledAppointments = allAppointments.filter(app => {
     if (!app.start) return false;
     return app.status === 'cancelled';
  });
  cancelledAppointments.sort((a, b) => new Date(b.start as string).getTime() - new Date(a.start as string).getTime()); // descending

  const hasAnyAppointments = allAppointments.length > 0;

  const handleOpenDrawer = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleEnterWorkspace = () => {
    if (selectedAppointment) {
      setActiveWorkspaceApp(selectedAppointment);
      setSelectedAppointment(null);
    }
  };

  const renderAppointmentCard = (app: Appointment, isNext = false) => {
    const statusData = mapStatus(app.status);
    const startDate = app.start ? new Date(app.start) : null;
    const endDate = app.end ? new Date(app.end) : null;

    return (
      <UnstyledButton
        key={app.id}
        w="100%"
        onClick={() => handleOpenDrawer(app)}
        style={{ textAlign: 'left', borderRadius: 'var(--mantine-radius-lg)' }}
        aria-label={`Ver detalhes da consulta ${app.description || 'Consulta'}`}
      >
        <Card
          p="lg"
          radius="lg"
          bg="white"
          shadow={isNext ? "sm" : "none"}
          withBorder
          style={{ transition: 'box-shadow 0.2s', borderColor: isNext ? 'var(--mantine-color-teal-5)' : undefined }}
        >
          <Group justify="space-between" mb="sm" wrap="nowrap">
            <StatusBadge status={statusData.semantic} size="sm" fw={700}>
              {statusData.label}
            </StatusBadge>
            {isNext && <Badge color="teal" variant="filled" size="sm">Próxima</Badge>}
          </Group>

          <Group wrap="nowrap" align="flex-start">
            <ThemeIcon size={isNext ? 48 : 40} radius="md" color={isNext ? "teal.6" : "gray.2"} variant="light">
               <IconCalendarEvent size={isNext ? 24 : 20} stroke={2} color={isNext ? undefined : "var(--mantine-color-gray-6)"} />
            </ThemeIcon>
            <Box flex={1}>
              <Title order={isNext ? 4 : 5} c="dark.9" fw={700} lineClamp={1}>
                {app.description || 'Consulta'}
              </Title>
              <Text size="sm" c="dimmed" fw={500} mt={2}>
                 {startDate ? startDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data a definir'}
              </Text>
              <Group gap="xs" mt={4}>
                 <IconClock size={14} color="var(--mantine-color-dimmed)" />
                 <Text size="xs" c="dimmed">
                   {startDate ? startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                   {endDate && ` - ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                 </Text>
              </Group>
            </Box>
          </Group>
        </Card>
      </UnstyledButton>
    );
  };

  if (activeWorkspaceApp) {
    return (
      <Stack gap="xl" h="100%">
        <Group justify="space-between">
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
            Sala de Vídeo
          </Title>
          <Button variant="light" color="red" onClick={() => setActiveWorkspaceApp(null)}>
            Sair da Sala
          </Button>
        </Group>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card p="xl" radius="xl" bg="black" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }} withBorder>
              <Box flex={1} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <EmptyState
                  icon={<IconVideoOff size={48} stroke={1.5} color="var(--mantine-color-gray-6)" />}
                  title="Telemedicina Indisponível"
                  description="Telemedicina ainda não está disponível para esta consulta."
                />
              </Box>

              <Group justify="center" gap="md" mt="xl">
                <ActionIcon size="xl" radius="xl" variant="filled" color="dark.6" disabled aria-label="Microfone indisponível">
                  <IconMicrophone size={24} />
                </ActionIcon>
                <ActionIcon size="xl" radius="xl" variant="filled" color="dark.6" disabled aria-label="Câmera indisponível">
                  <IconVideoOff size={24} />
                </ActionIcon>
                <ActionIcon size="xl" radius="xl" variant="filled" color="red" onClick={() => setActiveWorkspaceApp(null)} aria-label="Encerrar consulta">
                  <IconPhone size={24} />
                </ActionIcon>
              </Group>
            </Card>

            <Box hiddenFrom="md" mt="lg">
              <Button fullWidth variant="light" onClick={() => setSelectedAppointment(activeWorkspaceApp)}>
                Ver Detalhes da Consulta
              </Button>
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
            <Card p="lg" radius="lg" withBorder>
              <Title order={4} fw={700} mb="lg">Detalhes</Title>
              <Stack gap="md">
                <Box>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Paciente</Text>
                  <Text size="sm" fw={500}>{data?.profile?.name?.[0]?.text || 'Paciente não informado'}</Text>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Profissional</Text>
                  <Text size="sm" fw={500}>{getPractitionerName(activeWorkspaceApp)}</Text>
                </Box>

                <Box>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Data e Hora</Text>
                  <Text size="sm" fw={500}>
                    {activeWorkspaceApp.start ? new Date(activeWorkspaceApp.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'A definir'}
                  </Text>
                </Box>

                <Box>
                   <Text size="xs" c="dimmed" fw={600} tt="uppercase">Modalidade</Text>
                   <Text size="sm" fw={500}>{activeWorkspaceApp.appointmentType?.text || 'Telemedicina'}</Text>
                </Box>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Drawer
          opened={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          position="right"
          size="md"
          title={<Text size="lg" fw={700}>Detalhes da Consulta</Text>}
          padding="xl"
        >
          {selectedAppointment && (
            <Stack gap="lg">
              <Group justify="space-between">
                  <StatusBadge status={mapStatus(selectedAppointment.status).semantic} size="md">
                    {mapStatus(selectedAppointment.status).label}
                  </StatusBadge>
              </Group>

              <Box>
                <Title order={3} fw={800} c="dark.9" mb="xs">
                  {selectedAppointment.description || 'Consulta'}
                </Title>
                <Group gap="xs" mb={4}>
                  <IconCalendarEvent size={18} color="var(--mantine-color-teal-6)" />
                  <Text size="md" fw={600} c="dark.8">
                      {selectedAppointment.start ? new Date(selectedAppointment.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data a definir'}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={18} color="var(--mantine-color-teal-6)" />
                  <Text size="md" fw={500} c="dark.7">
                      {selectedAppointment.start ? new Date(selectedAppointment.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      {selectedAppointment.end && ` às ${new Date(selectedAppointment.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                </Group>
              </Box>

              <Card p="md" radius="md" bg="var(--mantine-color-gray-0)" withBorder>
                  <Stack gap="sm">
                    <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconStethoscope size={14} /></ThemeIcon>
                        <Box>
                          <Text size="xs" c="dimmed" fw={600} tt="uppercase">Profissional</Text>
                          <Text size="sm" fw={500}>{getPractitionerName(selectedAppointment)}</Text>
                        </Box>
                    </Group>
                    {selectedAppointment.appointmentType?.text && (
                        <Group wrap="nowrap" align="flex-start">
                          <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconVideo size={14} /></ThemeIcon>
                          <Box>
                              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Modalidade</Text>
                              <Text size="sm" fw={500}>{selectedAppointment.appointmentType.text}</Text>
                          </Box>
                        </Group>
                    )}
                    {selectedAppointment.comment && (
                        <Group wrap="nowrap" align="flex-start">
                          <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconNotes size={14} /></ThemeIcon>
                          <Box>
                              <Text size="xs" c="dimmed" fw={600} tt="uppercase">Observações</Text>
                              <Text size="sm" fw={500}>{selectedAppointment.comment}</Text>
                          </Box>
                        </Group>
                    )}
                  </Stack>
              </Card>
            </Stack>
          )}
        </Drawer>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Minhas Consultas
      </Title>

      {!hasAnyAppointments && (
         <EmptyState
            icon={<IconCalendarEvent size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
            title="Nenhuma consulta"
            description="Você não possui histórico ou consultas agendadas no momento."
         />
      )}

      {hasAnyAppointments && (
         <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
               <Stack gap="lg">
                 {nextAppointment && (
                   <Box>
                     <Text size="sm" fw={600} c="dimmed" mb="xs" tt="uppercase">Próxima Consulta</Text>
                     {renderAppointmentCard(nextAppointment, true)}
                   </Box>
                 )}

                 {otherFutureAppointments.length > 0 && (
                   <Box>
                     <Text size="sm" fw={600} c="dimmed" mb="xs" tt="uppercase" mt="md">Consultas Futuras</Text>
                     <Stack gap="sm">
                       {otherFutureAppointments.map(app => renderAppointmentCard(app))}
                     </Stack>
                   </Box>
                 )}

                 {!nextAppointment && otherFutureAppointments.length === 0 && (
                   <Box>
                     <Text size="sm" fw={600} c="dimmed" mb="xs" tt="uppercase">Próximas Consultas</Text>
                     <Card p="md" radius="lg" withBorder bg="var(--mantine-color-gray-0)">
                       <Group wrap="nowrap">
                         <ThemeIcon size="lg" radius="xl" color="gray.4" variant="light"><IconCalendarEvent size={20} /></ThemeIcon>
                         <Text size="sm" c="dimmed" fw={500}>Nenhuma consulta futura agendada.</Text>
                       </Group>
                     </Card>
                   </Box>
                 )}
               </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
               <Stack gap="lg">
                 <Box>
                    <Text size="sm" fw={600} c="dimmed" mb="xs" tt="uppercase">Anteriores</Text>
                    {pastAppointments.length > 0 ? (
                       <Stack gap="sm">
                          {pastAppointments.map(app => renderAppointmentCard(app))}
                       </Stack>
                    ) : (
                       <Card p="md" radius="lg" withBorder bg="var(--mantine-color-gray-0)">
                          <Text size="sm" c="dimmed" ta="center">Nenhum histórico de consultas.</Text>
                       </Card>
                    )}
                 </Box>

                 {cancelledAppointments.length > 0 && (
                    <Box>
                       <Text size="sm" fw={600} c="dimmed" mb="xs" tt="uppercase">Canceladas</Text>
                       <Stack gap="sm">
                          {cancelledAppointments.map(app => renderAppointmentCard(app))}
                       </Stack>
                    </Box>
                 )}
               </Stack>
            </Grid.Col>
         </Grid>
      )}

      <Drawer
        opened={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        position="right"
        size="md"
        title={
          <Text size="lg" fw={700}>Detalhes da Consulta</Text>
        }
        padding="xl"
      >
        {selectedAppointment && (
          <Stack gap="lg">
             <Group justify="space-between">
                <StatusBadge status={mapStatus(selectedAppointment.status).semantic} size="md">
                  {mapStatus(selectedAppointment.status).label}
                </StatusBadge>
             </Group>

             <Box>
               <Title order={3} fw={800} c="dark.9" mb="xs">
                 {selectedAppointment.description || 'Consulta'}
               </Title>

               <Group gap="xs" mb={4}>
                 <IconCalendarEvent size={18} color="var(--mantine-color-teal-6)" />
                 <Text size="md" fw={600} c="dark.8">
                    {selectedAppointment.start ? new Date(selectedAppointment.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data a definir'}
                 </Text>
               </Group>

               <Group gap="xs">
                 <IconClock size={18} color="var(--mantine-color-teal-6)" />
                 <Text size="md" fw={500} c="dark.7">
                    {selectedAppointment.start ? new Date(selectedAppointment.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    {selectedAppointment.end && ` às ${new Date(selectedAppointment.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                 </Text>
               </Group>
             </Box>

             <Card p="md" radius="md" bg="var(--mantine-color-gray-0)" withBorder>
                <Stack gap="sm">
                  <Group wrap="nowrap" align="flex-start">
                     <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconStethoscope size={14} /></ThemeIcon>
                     <Box>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">Profissional</Text>
                        <Text size="sm" fw={500}>{getPractitionerName(selectedAppointment)}</Text>
                     </Box>
                  </Group>

                  {selectedAppointment.appointmentType?.text && (
                     <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconVideo size={14} /></ThemeIcon>
                        <Box>
                           <Text size="xs" c="dimmed" fw={600} tt="uppercase">Modalidade</Text>
                           <Text size="sm" fw={500}>{selectedAppointment.appointmentType.text}</Text>
                        </Box>
                     </Group>
                  )}

                  {selectedAppointment.comment && (
                     <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconNotes size={14} /></ThemeIcon>
                        <Box>
                           <Text size="xs" c="dimmed" fw={600} tt="uppercase">Observações</Text>
                           <Text size="sm" fw={500}>{selectedAppointment.comment}</Text>
                        </Box>
                     </Group>
                  )}
                </Stack>
             </Card>

             {!activeWorkspaceApp && isTelemedicine(selectedAppointment) && (
               <Button
                 fullWidth
                 size="lg"
                 radius="md"
                 color="teal"
                 leftSection={<IconVideo size={20} />}
                 onClick={handleEnterWorkspace}
                 mt="auto"
               >
                 Acessar Telemedicina
               </Button>
             )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
