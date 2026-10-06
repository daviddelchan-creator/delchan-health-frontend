"use client";

import { useState } from 'react';
import { Stack, Title, Card, Text, Group, Badge, Grid, ThemeIcon, Box } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconUser, IconStethoscope, IconVideo, IconMapPin, IconNotes } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { Appointment, Reference, Practitioner } from '@medplum/fhirtypes';
import { StatusBadge, StatusSemanticType } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickViewDrawer } from '@/components/ui/QuickViewDrawer';

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
function getPractitionerName(appointment: Appointment): string {
  if (!appointment.participant) return 'Profissional não informado';

  const practitionerParticipant = appointment.participant.find(
    (p) => p.actor?.reference?.startsWith('Practitioner/')
  );

  if (practitionerParticipant && practitionerParticipant.actor?.display) {
    return practitionerParticipant.actor.display;
  }

  return 'Profissional não informado';
}

export default function ConsultasPage() {
  const { state, data } = usePatientDashboardContext();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN' || state === 'ERROR') {
      return null;
  }

  const allAppointments = data?.appointments || [];
  const now = new Date();

  // Next appointment logic deterministically: future date, valid status, earliest start
  const validFutureStatuses = ['booked', 'arrived', 'pending'];
  const futureAppointments = allAppointments.filter(app => {
    if (!app.start) return false;
    return new Date(app.start) >= now && validFutureStatuses.includes(app.status || '');
  });

  futureAppointments.sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime());

  const nextAppointment = futureAppointments.length > 0 ? futureAppointments[0] : null;
  const otherFutureAppointments = futureAppointments.slice(1);

  // Past appointments: end date in past, or fulfilled/cancelled status
  const pastAppointments = allAppointments.filter(app => {
     if (!app.start) return false;
     const isPast = new Date(app.start) < now;
     const isPastStatus = ['fulfilled', 'cancelled', 'noshow'].includes(app.status || '');
     return isPast || isPastStatus;
  });
  pastAppointments.sort((a, b) => new Date(b.start as string).getTime() - new Date(a.start as string).getTime()); // descending

  const hasAnyAppointments = allAppointments.length > 0;

  const handleOpenDrawer = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const renderAppointmentCard = (app: Appointment, isNext = false) => {
    const statusData = mapStatus(app.status);
    const startDate = app.start ? new Date(app.start) : null;
    const endDate = app.end ? new Date(app.end) : null;
    const practitionerName = getPractitionerName(app);

    const isTelemedicine = app.appointmentType?.coding?.some(c => c.code === 'telemedicine') ||
                           app.appointmentType?.text?.toLowerCase().includes('tele');

    return (
      <Card
        key={app.id}
        p="lg"
        radius="lg"
        bg="white"
        shadow={isNext ? "sm" : "none"}
        withBorder
        style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', borderColor: isNext ? 'var(--mantine-color-teal-5)' : undefined }}
        onClick={() => handleOpenDrawer(app)}
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
    );
  };

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
            </Grid.Col>
         </Grid>
      )}

      <QuickViewDrawer
        opened={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        position="right"
        size="md"
        title={
          <Title order={4} fw={700}>Detalhes da Consulta</Title>
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

                  {selectedAppointment.appointmentType && (
                     <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon color="teal" variant="light" size="sm" mt={2}><IconVideo size={14} /></ThemeIcon>
                        <Box>
                           <Text size="xs" c="dimmed" fw={600} tt="uppercase">Modalidade</Text>
                           <Text size="sm" fw={500}>{selectedAppointment.appointmentType?.text || 'Presencial'}</Text>
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
      </QuickViewDrawer>
    </Stack>
  );
}
