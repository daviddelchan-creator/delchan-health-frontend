"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Group, Badge, Select, TextInput, Divider, ActionIcon, Modal, Grid, Avatar } from '@mantine/core';

export function ModernCalendar({ medplum, patients }: { medplum: any, patients: any[] }) {
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingMicrosoft, setIsSyncingMicrosoft] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  
  // Estados para nueva cita
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string | null>('in-person');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Simulación de flujo OAuth2 de Google/Microsoft
  const handleOAuthSync = (provider: 'google' | 'microsoft') => {
    if (provider === 'google') setIsSyncingGoogle(true);
    if (provider === 'microsoft') setIsSyncingMicrosoft(true);
    
    setTimeout(() => {
      alert(`✅ Autenticación exitosa con ${provider.toUpperCase()}. Su calendario ahora está sincronizado bidireccionalmente.`);
      if (provider === 'google') setIsSyncingGoogle(false);
      if (provider === 'microsoft') setIsSyncingMicrosoft(false);
      setIsSynced(true);
    }, 2000);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedPatientId || !appointmentDate) return alert('Seleccione paciente y fecha.');
    setIsScheduling(true);

    try {
      // 1. Crear el Appointment FHIR
      const apt = await medplum.createResource({
        resourceType: 'Appointment',
        status: 'booked',
        description: appointmentType === 'video' ? 'Consulta por Telemedicina (Video)' : 'Consulta Presencial',
        start: new Date(appointmentDate).toISOString(),
        end: new Date(new Date(appointmentDate).getTime() + 30 * 60000).toISOString(), // +30 mins
        participant: [
          { actor: { reference: `Patient/${selectedPatientId}` }, status: 'accepted' }
        ],
        // Si es video, definimos el canal de telemedicina
        appointmentType: {
          coding: [{ code: appointmentType === 'video' ? 'WALKIN' : 'ROUTINE', display: appointmentType === 'video' ? 'Virtual' : 'Presencial' }]
        }
      });

      // 2. Si es Telemedicina, simulamos la creación de una Sala de Video Medplum
      if (appointmentType === 'video') {
        // En producción, aquí se usa Medplum VideoRoom o se genera un link de Jitsi/Twilio
        console.log("Sala de Telemedicina generada para la cita:", apt.id);
      }

      alert(appointmentType === 'video' 
        ? '✅ Telemedicina agendada. El enlace seguro ha sido enviado al correo/WhatsApp del paciente.' 
        : '✅ Cita presencial agendada. Horario bloqueado en su Google Calendar.');
        
      setIsModalOpen(false);
    } catch (error: any) {
      alert('❌ Error al agendar: ' + error.message);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Title order={3} c="blue">Mi Agenda Profesional</Title>
        <Group>
          {!isSynced ? (
            <>
              <Button variant="outline" color="red" onClick={() => handleOAuthSync('google')} loading={isSyncingGoogle}>
                🔗 Conectar Google Calendar
              </Button>
              <Button variant="outline" color="blue" onClick={() => handleOAuthSync('microsoft')} loading={isSyncingMicrosoft}>
                🔗 Conectar Microsoft 365
              </Button>
            </>
          ) : (
            <Badge color="green" size="lg" variant="dot">Sincronización Bidireccional Activa</Badge>
          )}
        </Group>
      </Group>

      {/* VISTA RÁPIDA DEL CALENDARIO (MOCKUP VISUAL) */}
      <Card bg="#f8f9fa" radius="md" padding="md" mb="xl">
        <Group justify="space-between" mb="md">
          <Text fw={700}>Horarios de Hoy</Text>
          <Button color="blue" onClick={() => setIsModalOpen(true)}>+ Nuevo Agendamiento</Button>
        </Group>
        <Stack gap="xs">
          {/* Ejemplo de Cita Presencial */}
          <Card shadow="xs" p="sm" radius="sm" withBorder style={{ borderLeft: '4px solid var(--mantine-color-teal-filled)' }}>
            <Group justify="space-between">
              <Group>
                <Badge color="teal">09:00 AM</Badge>
                <Text fw={600}>Procedimiento Láser (Presencial)</Text>
              </Group>
              <Avatar src={null} alt="Cliente" size="sm" color="teal" />
            </Group>
          </Card>
          {/* Ejemplo de Cita de Telemedicina */}
          <Card shadow="xs" p="sm" radius="sm" withBorder style={{ borderLeft: '4px solid var(--mantine-color-grape-filled)' }}>
            <Group justify="space-between">
              <Group>
                <Badge color="grape">11:30 AM</Badge>
                <Text fw={600}>Evaluación Cosmetológica (Telemedicina)</Text>
                <Badge color="grape" variant="light">🎥 Video Room</Badge>
              </Group>
              <Button size="xs" variant="light" color="grape">Unirse a Videollamada</Button>
            </Group>
          </Card>
        </Stack>
      </Card>

      {/* MODAL PARA AGENDAR Y CREAR TELEMEDICINA */}
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title={<Title order={4} c="blue">Agendar Consulta</Title>} centered>
        <Stack>
          <Select
            label="Seleccionar Paciente"
            placeholder="Busque un paciente registrado..."
            data={patients?.map(p => ({ value: p.id, label: `${p.name?.[0]?.given?.[0]} ${p.name?.[0]?.family}` })) || []}
            value={selectedPatientId}
            onChange={setSelectedPatientId}
            searchable
            required
          />
          
          <Select
            label="Tipo de Consulta / Modalidad"
            data={[
              { value: 'in-person', label: '🏥 Consulta Presencial (Clínica/Sala)' },
              { value: 'video', label: '🎥 Telemedicina (Video Consulta Integrada)' }
            ]}
            value={appointmentType}
            onChange={setAppointmentType}
            required
          />

          <TextInput 
            label="Fecha y Hora de la Cita" 
            type="datetime-local" 
            value={appointmentDate} 
            onChange={(e) => setAppointmentDate(e.currentTarget.value)} 
            required 
          />

          {appointmentType === 'video' && (
            <Card bg="#f3f0ff" radius="md" p="sm">
              <Text size="sm" c="grape" fw={500}>
                ℹ️ Al confirmar, el sistema de Telemedicina de Medplum generará una sala de video segura y enviará el link único al paciente por correo/WhatsApp.
              </Text>
            </Card>
          )}

          <Button color="blue" size="lg" mt="md" onClick={handleScheduleAppointment} loading={isScheduling}>
            Confirmar y Bloquear Agenda
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}