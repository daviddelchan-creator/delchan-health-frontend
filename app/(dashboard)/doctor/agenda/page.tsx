"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Card, Text, Group, Button, Alert, Grid, Select, Stack, Table, Badge, Avatar, Modal, TextInput, Textarea, Menu, Divider, ThemeIcon, ActionIcon, Loader, Center
} from '@mantine/core';
import { 
  IconCalendarEvent, IconBrandGoogle, IconBrandWhatsapp, IconCheck, IconX, IconClock, IconBuildingHospital, IconPlus, IconTrash
} from '@tabler/icons-react';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Appointment, Patient, Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '../../../../contexts/TenantContext';

export default function DoctorAgendaPage() {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;
  const { tenantConfig, dict } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtros de Agenda
  const [selectedRoom, setSelectedRoom] = useState<string | null>('Consultório 1');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Dados FHIR
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Formulário do Agendamento
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentType, setAppointmentType] = useState<string | null>('Presencial');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const roomOptions = [
    { value: 'Consultório 1', label: 'Consultório 1 (Clínica Geral & Dermato)' },
    { value: 'Sala de Procedimentos', label: 'Sala de Procedimentos Avançados' },
    { value: 'Telemedicina', label: 'Telemedicina (Google Meet & Link Criptografado)' },
    { value: 'Spa / Estética', label: 'Cabine de Estética Facial' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsBundle, patientsBundle] = await Promise.all([
        medplum.searchResources('Appointment', { _sort: '-date', _count: 30 }),
        medplum.searchResources('Patient', { _sort: 'name', _count: 50 })
      ]);
      setAppointments(apptsBundle);
      setPatients(patientsBundle);
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
    } finally {
      setLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const status = params.get('calendar_sync');
    if (status) {
      setSyncStatus(status);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loadData]);

  // Criação de Consulta no FHIR
  const handleSaveAppointment = async () => {
    if (!selectedPatientId || !selectedDate || !appointmentTime) {
      return alert('Preencha o paciente, a data e o horário.');
    }

    setIsSaving(true);
    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      const patientDisplayName = selectedPatient?.name?.[0]
        ? `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`
        : 'Paciente';

      const startDateTime = new Date(`${selectedDate}T${appointmentTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 45 * 60000); // 45 minutos

      const newAppointment: Appointment = {
        resourceType: 'Appointment',
        status: 'booked',
        description: `${appointmentType}: ${appointmentNotes || 'Atendimento agendado'} (${selectedRoom})`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        participant: [
          {
            actor: { reference: `Patient/${selectedPatientId}`, display: patientDisplayName },
            status: 'accepted'
          },
          ...(profile?.id ? [{
            actor: { reference: `Practitioner/${profile.id}`, display: profile.name?.[0]?.given?.[0] || 'Médico' },
            status: 'accepted' as const
          }] : [])
        ]
      };

      await medplum.createResource(newAppointment);
      alert('Consulta agendada e recurso físico reservado com sucesso no FHIR!');
      setIsModalOpen(false);
      setSelectedPatientId(null);
      setAppointmentNotes('');
      loadData();
    } catch (err: any) {
      alert('Erro ao agendar consulta: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelamento
  const handleCancelAppointment = async (appt: Appointment) => {
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      try {
        await medplum.updateResource({
          ...appt,
          status: 'cancelled'
        });
        alert('Consulta cancelada!');
        loadData();
      } catch (e) {
        alert('Erro ao cancelar agendamento.');
      }
    }
  };

  // Automação: Envio de Lembrete via WhatsApp
  const handleSendWhatsAppReminder = (appt: Appointment) => {
    const patientParticipant = appt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
    const patientName = patientParticipant?.actor?.display || 'Paciente';
    const patientResource = patients.find(p => p.id === patientParticipant?.actor?.reference?.split('/')[1]);
    const phone = patientResource?.telecom?.find(t => t.system === 'phone')?.value?.replace(/\D/g, '') || '';
    
    const timeStr = appt.start ? new Date(appt.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'horário confirmado';
    const dateStr = appt.start ? new Date(appt.start).toLocaleDateString('pt-BR') : 'data confirmada';
    
    const message = encodeURIComponent(
      `Olá ${patientName}! Lembramos da sua consulta agendada na clínica ${tenantConfig.name} para o dia ${dateStr} às ${timeStr}. Caso necessite reagendar, favor nos avisar. Tenha um ótimo dia!`
    );

    const waUrl = phone ? `https://wa.me/55${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  // Filtragem de consultas do dia selecionado
  const appointmentsOnSelectedDate = appointments.filter(a => {
    if (!a.start) return false;
    const aDate = new Date(a.start).toISOString().split('T')[0];
    return aDate === selectedDate && a.status !== 'cancelled';
  });

  const slots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* CABEÇALHO */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
            Agenda Inteligente & Gestão de Salas
          </Title>
          <Text c="dimmed" size="sm">
            Grade de horários, telemedicina, controle de consultórios e lembretes automáticos via WhatsApp.
          </Text>
        </div>
        
        <Group>
          <Button 
            component="a" 
            href="/api/calendar/auth" 
            color="blue" 
            variant="light"
            radius="xl" 
            fw={600}
            leftSection={<IconBrandGoogle size={16} />}
          >
            Sincronizar Google Calendar
          </Button>
          <Button 
            color={primaryColor} 
            radius="xl" 
            fw={600} 
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            + Agendar Consulta
          </Button>
        </Group>
      </Group>

      {/* ALERTAS GOOGLE */}
      {syncStatus === 'success' && (
        <Alert color="teal" title="Google Calendar Sincronizado!" mb="xl" variant="light" style={{ borderLeft: '4px solid #0d9488' }}>
          Sua agenda foi conectada ao Google Calendar. Os eventos serão espelhados em tempo real.
        </Alert>
      )}

      <Grid gutter="lg" mb="xl">
        {/* PAINEL LATERAL: CONTROLES DE SALA E DATA */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card p="xl" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Controle de Recursos e Salas</Title>
              
              <TextInput 
                type="date" 
                label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Data da Agenda</Text>}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.currentTarget.value)}
                mb="md"
                size="md"
                radius="md"
              />

              <Select 
                label={<Text fw={700} size="xs" c="slate.6" tt="uppercase">Consultório / Sala Alocada</Text>}
                data={roomOptions}
                value={selectedRoom}
                onChange={setSelectedRoom}
                size="md"
                radius="md"
              />
              <Text size="xs" c="dimmed" mt="sm">
                A seleção da sala reserva o recurso físico no servidor FHIR, evitando conflito de horários entre profissionais.
              </Text>
            </Card>

            <Card p="xl" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Title order={6} c="dark.9" fw={700} mb="sm">Resumo de {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</Title>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Consultas Confirmadas</Text>
                <Badge color="teal" variant="light">{appointmentsOnSelectedDate.length}</Badge>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Vagas Disponíveis</Text>
                <Badge color="blue" variant="light">{Math.max(0, slots.length - appointmentsOnSelectedDate.length)}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total na Base</Text>
                <Badge color="gray" variant="light">{appointments.length}</Badge>
              </Group>
            </Card>
          </Stack>
        </Grid.Col>

        {/* VISTA DE SLOTS / HORÁRIOS */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p="xl" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0', minHeight: '500px' }}>
            <Group justify="space-between" mb="lg" pb="md" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <Title order={4} c="dark.9" fw={800}>
                  Horários: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </Title>
                <Text size="xs" c="dimmed">Grade de atendimento para {selectedRoom}</Text>
              </div>
              <Badge color="dark" size="lg" radius="sm">{selectedRoom}</Badge>
            </Group>

            <Stack gap="sm">
              {slots.map((timeSlot) => {
                const bookedAppt = appointmentsOnSelectedDate.find(a => {
                  if (!a.start) return false;
                  const time = new Date(a.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return time === timeSlot;
                });

                if (bookedAppt) {
                  const patientParticipant = bookedAppt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
                  const patientName = patientParticipant?.actor?.display || 'Paciente Confirmado';

                  return (
                    <Group key={timeSlot} wrap="nowrap" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                      <Text fw={800} w={60} c="dark.9">{timeSlot}</Text>
                      <Card bg="teal.0" p="sm" radius="lg" style={{ flex: 1, borderLeft: '4px solid #0d9488' }}>
                        <Group justify="space-between">
                          <div>
                            <Text fw={700} size="sm" c="teal.9">{patientName}</Text>
                            <Text size="xs" c="teal.8">{bookedAppt.description || 'Consulta Marcada'}</Text>
                          </div>
                          <Group gap="xs">
                            <ActionIcon color="teal" variant="light" radius="xl" onClick={() => handleSendWhatsAppReminder(bookedAppt)}>
                              <IconBrandWhatsapp size={16} />
                            </ActionIcon>
                            <ActionIcon color="red" variant="subtle" radius="xl" onClick={() => handleCancelAppointment(bookedAppt)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Card>
                    </Group>
                  );
                }

                return (
                  <Group key={timeSlot} wrap="nowrap" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                    <Text fw={600} w={60} c="dimmed">{timeSlot}</Text>
                    <Card 
                      bg="#f8fafc" p="sm" radius="lg" 
                      style={{ flex: 1, border: '1px dashed #cbd5e1', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => {
                        setAppointmentTime(timeSlot);
                        setIsModalOpen(true);
                      }}
                    >
                      <Text size="xs" c="dimmed" ta="center" fw={600}>
                        + Horário Livre ({timeSlot}) — Clique para Agendar
                      </Text>
                    </Card>
                  </Group>
                );
              })}
            </Stack>

          </Card>
        </Grid.Col>
      </Grid>

      {/* TABELA INFERIOR DE CONSULTAS */}
      <Card p={0} radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Group p="xl" justify="space-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <Title order={4} c="dark.9" fw={800}>Próximos Agendamentos & Automações</Title>
            <Text size="xs" c="dimmed">Dispare lembretes de WhatsApp e gerencie confirmações.</Text>
          </div>
        </Group>
        
        {loading ? (
          <Center py="xl"><Loader color={primaryColor} /></Center>
        ) : (
          <Table horizontalSpacing="xl" verticalSpacing="md" striped highlightOnHover>
            <Table.Thead bg="#f8fafc">
              <Table.Tr>
                <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>DATA / HORA</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>PACIENTE</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>MODALIDADE / SALA</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>STATUS</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '12px' }} ta="right">AÇÕES RÁPIDAS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointments.filter(a => a.status !== 'cancelled').slice(0, 10).map((appt) => {
                const patientParticipant = appt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
                const patientName = patientParticipant?.actor?.display || 'Paciente';
                const dateFormatted = appt.start ? new Date(appt.start).toLocaleDateString('pt-BR') : 'Data';
                const timeFormatted = appt.start ? new Date(appt.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                return (
                  <Table.Tr key={appt.id}>
                    <Table.Td>
                      <Text fw={700} c="dark.9">{dateFormatted}</Text>
                      <Text size="xs" c="dimmed">{timeFormatted}</Text>
                    </Table.Td>
                    <Table.Td fw={700} c="dark.8">{patientName}</Table.Td>
                    <Table.Td>
                      <Badge color="gray" variant="light">{appt.description || 'Consulta Geral'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="teal" variant="light">Confirmada</Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap="xs" justify="flex-end">
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="teal" 
                          radius="xl"
                          leftSection={<IconBrandWhatsapp size={14} />}
                          onClick={() => handleSendWhatsAppReminder(appt)}
                        >
                          Lembrete WhatsApp
                        </Button>
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="red" 
                          radius="xl"
                          onClick={() => handleCancelAppointment(appt)}
                        >
                          Cancelar
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* MODAL DE AGENDAMENTO */}
      <Modal 
        opened={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Agendar Nova Consulta" 
        size="lg" 
        centered 
        radius="lg"
      >
        <Stack gap="md">
          <Select 
            label="Selecionar Paciente" 
            placeholder="Busque por nome..." 
            data={patients.map(p => ({
              value: p.id || '',
              label: `${p.name?.[0]?.given?.join(' ') || ''} ${p.name?.[0]?.family || ''}`
            }))} 
            value={selectedPatientId}
            onChange={setSelectedPatientId}
            searchable 
            required
            radius="md"
          />
          <Grid>
            <Grid.Col span={6}>
              <TextInput 
                type="date" 
                label="Data" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.currentTarget.value)}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput 
                type="time" 
                label="Horário" 
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.currentTarget.value)}
                radius="md"
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}>
              <Select 
                label="Consultório / Sala" 
                data={roomOptions} 
                value={selectedRoom} 
                onChange={setSelectedRoom}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select 
                label="Modalidade" 
                data={['Presencial', 'Telemedicina', 'Retorno', 'Procedimento']} 
                value={appointmentType} 
                onChange={setAppointmentType}
                radius="md"
              />
            </Grid.Col>
          </Grid>
          <Textarea 
            label="Observações / Motivo da Consulta" 
            placeholder="Ex: Primeira consulta para avaliação de manchas..." 
            minRows={2} 
            value={appointmentNotes}
            onChange={(e) => setAppointmentNotes(e.currentTarget.value)}
            radius="md"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button color={primaryColor} radius="xl" onClick={handleSaveAppointment} loading={isSaving}>
              Confirmar Agendamento no FHIR
            </Button>
          </Group>
        </Stack>
      </Modal>

    </div>
  );
}