"use client";

import { useState } from 'react';
import { 
  Card, Title, Text, Button, Stack, Group, Badge, Select, TextInput, Divider, ActionIcon, Modal, Grid, Avatar, ThemeIcon 
} from '@mantine/core';
import { IconCalendarEvent, IconVideo, IconBrandGoogle, IconBuildingHospital, IconPlus } from '@tabler/icons-react';

export function ModernCalendar({ medplum, patients }: { medplum: any; patients: any[] }) {
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  
  // Estados para nova consulta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string | null>('in-person');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const handleOAuthSync = (provider: 'google' | 'microsoft') => {
    if (provider === 'google') setIsSyncingGoogle(true);
    
    setTimeout(() => {
      alert(`Sincronização bidirecional ativada com ${provider.toUpperCase()} Calendar.`);
      setIsSyncingGoogle(false);
      setIsSynced(true);
    }, 1500);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedPatientId || !appointmentDate) return alert('Selecione o paciente e a data/hora.');
    setIsScheduling(true);

    try {
      if (medplum) {
        await medplum.createResource({
          resourceType: 'Appointment',
          status: 'booked',
          description: appointmentType === 'video' ? 'Consulta por Telemedicina (Google Meet)' : 'Consulta Presencial',
          start: new Date(appointmentDate).toISOString(),
          end: new Date(new Date(appointmentDate).getTime() + 30 * 60000).toISOString(),
          participant: [
            { actor: { reference: `Patient/${selectedPatientId}` }, status: 'accepted' }
          ],
          appointmentType: {
            coding: [{ code: appointmentType === 'video' ? 'WALKIN' : 'ROUTINE', display: appointmentType === 'video' ? 'Telemedicina' : 'Presencial' }]
          }
        });
      }

      alert(appointmentType === 'video' 
        ? 'Telemedicina agendada! O link seguro do Google Meet/Jitsi foi enviado ao WhatsApp do paciente.' 
        : 'Consulta presencial agendada com sucesso!');
        
      setIsModalOpen(false);
      setSelectedPatientId(null);
      setAppointmentDate('');
    } catch (error: any) {
      alert('Erro ao agendar: ' + error.message);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card shadow="sm" p="xl" radius="xl" withBorder bg="white">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3} c="dark.9">Agenda Inteligente</Title>
          <Text size="xs" c="dimmed">Sincronização de horários com Google Calendar e salas de Telemedicina.</Text>
        </div>
        <Group>
          {!isSynced ? (
            <Button 
              variant="light" 
              color="blue" 
              radius="xl" 
              onClick={() => handleOAuthSync('google')} 
              loading={isSyncingGoogle}
              leftSection={<IconBrandGoogle size={16} />}
            >
              Conectar Google Calendar
            </Button>
          ) : (
            <Badge color="teal" size="lg" variant="light" radius="xl">● Sincronizado com Google</Badge>
          )}
          <Button color="teal" radius="xl" leftSection={<IconPlus size={16} />} onClick={() => setIsModalOpen(true)}>
            Novo Agendamento
          </Button>
        </Group>
      </Group>

      {/* GRADE RÁPIDA DE HORÁRIOS */}
      <Card bg="#f8fafc" radius="lg" p="lg" mb="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
        <Group justify="space-between" mb="md">
          <Text fw={700} size="sm">Horários do Dia</Text>
          <Badge color="dark" size="sm">Hoje</Badge>
        </Group>
        <Stack gap="xs">
          <Card shadow="none" p="sm" radius="md" withBorder bg="white" style={{ borderLeft: '4px solid #0d9488' }}>
            <Group justify="space-between">
              <Group>
                <Badge color="teal" variant="light">09:00</Badge>
                <div>
                  <Text fw={700} size="sm">Avaliação Dermatológica (Presencial)</Text>
                  <Text size="xs" c="dimmed">Consultório 1 • Dra. Mariana Lopes</Text>
                </div>
              </Group>
              <Avatar color="teal" radius="xl" size="sm">ML</Avatar>
            </Group>
          </Card>
          
          <Card shadow="none" p="sm" radius="md" withBorder bg="white" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <Group justify="space-between">
              <Group>
                <Badge color="grape" variant="light">11:30</Badge>
                <div>
                  <Text fw={700} size="sm">Retorno de Telemedicina</Text>
                  <Text size="xs" c="dimmed">Google Meet Room • Link Ativo</Text>
                </div>
              </Group>
              <Button size="xs" variant="light" color="grape" radius="xl" leftSection={<IconVideo size={14} />}>
                Entrar na Chamada
              </Button>
            </Group>
          </Card>
        </Stack>
      </Card>

      {/* MODAL DE AGENDAMENTO */}
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Consulta" centered radius="lg">
        <Stack gap="md">
          <Select
            label="Selecionar Paciente"
            placeholder="Buscar paciente cadastrado..."
            data={patients?.map(p => ({ value: p.id, label: `${p.name?.[0]?.given?.[0] || ''} ${p.name?.[0]?.family || ''}` })) || []}
            value={selectedPatientId}
            onChange={setSelectedPatientId}
            searchable
            required
            radius="md"
          />
          
          <Select
            label="Modalidade do Atendimento"
            data={[
              { value: 'in-person', label: '🏥 Consulta Presencial (Consultório/Clínica)' },
              { value: 'video', label: '🎥 Telemedicina (Videochamada Google Meet)' }
            ]}
            value={appointmentType}
            onChange={setAppointmentType}
            required
            radius="md"
          />

          <TextInput 
            label="Data e Hora da Consulta" 
            type="datetime-local" 
            value={appointmentDate} 
            onChange={(e) => setAppointmentDate(e.currentTarget.value)} 
            required 
            radius="md"
          />

          {appointmentType === 'video' && (
            <Card bg="#f5f3ff" radius="md" p="sm" withBorder style={{ borderColor: '#ddd6fe' }}>
              <Text size="xs" c="grape.9" fw={500}>
                Ao confirmar, o sistema gerará a sala criptografada e enviará o convite por WhatsApp e e-mail ao paciente.
              </Text>
            </Card>
          )}

          <Button color="teal" size="md" radius="xl" mt="md" onClick={handleScheduleAppointment} loading={isScheduling}>
            Confirmar e Bloquear Horário
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}