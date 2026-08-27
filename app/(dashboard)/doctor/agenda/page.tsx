"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Card, Text, Group, Button, Alert, Grid, Select, Stack, Table, Badge, ActionIcon, Avatar, Modal, TextInput, Textarea, Menu, Divider
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';

export default function DoctorAgendaPage() {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  
  // Estados de la UI
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados de Agendamiento
  const [selectedRoom, setSelectedRoom] = useState<string | null>('Consultório 1');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Opciones de Salas Enterprise (Simulando FHIR Location/HealthcareService)
  const roomOptions = [
    { value: 'Consultório 1', label: 'Consultório 1 (Clínico Geral)' },
    { value: 'Sala de Procedimentos', label: 'Sala de Procedimentos (Samsung Business Display)' },
    { value: 'Telemedicina', label: 'Telemedicina (Google Meet / Teams API)' },
    { value: 'Spa / Estética', label: 'Sala de Estética Avançada' }
  ];

  const loadAppointments = useCallback(async () => {
    try {
      // En un futuro, aquí buscaremos recursos 'Appointment' de FHIR
      const bundle = await medplum.search('Patient', '_count=5'); // Usamos pacientes como mock para la tabla
      setAppointments(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { console.error(error); }
  }, [medplum]);

  useEffect(() => {
    loadAppointments();
    const params = new URLSearchParams(window.location.search);
    const status = params.get('calendar_sync');
    if (status) {
      setSyncStatus(status);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loadAppointments]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. CABECERA Y BOTÓN DE GOOGLE (Link real) */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Agenda & Salas</Title>
          <Text c="dimmed" size="sm">Gerencie horários, recursos físicos e integrações de telemedicina.</Text>
        </div>
        
        <Group>
          {/* Botón REAL para OAuth de Google */}
          <Button 
            component="a" 
            href="/api/calendar/auth" 
            color="blue" 
            variant="light"
            radius="md" 
            fw={600}
            leftSection={<Text size="md">G</Text>}
          >
            Sincronizar Google Calendar
          </Button>
          <Button color="teal" radius="md" fw={600} onClick={() => setIsModalOpen(true)}>
            + Agendar Consulta
          </Button>
        </Group>
      </Group>

      {/* ALERTAS DE GOOGLE */}
      {syncStatus === 'success' && (
        <Alert color="teal" title="Conexão Estabelecida!" mb="xl" variant="light" style={{ borderLeft: '4px solid #14b8a6' }}>
          O calendário foi sincronizado com sucesso. Os eventos serão espelhados em tempo real.
        </Alert>
      )}
      {syncStatus === 'error' && (
        <Alert color="red" title="Erro de Autenticação" mb="xl" variant="light" style={{ borderLeft: '4px solid #ef4444' }}>
          O Google bloqueou a conexão. Verifique se o seu email está na lista de 'Test Users' no Google Cloud.
        </Alert>
      )}

      <Grid gutter="lg" mb="xl">
        {/* 2. PANEL LATERAL: CALENDARIO Y SALAS */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
              <Title order={5} c="dark.9" fw={700} mb="md">Controle de Recursos</Title>
              
              <TextInput 
                type="date" 
                label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Data da Agenda</Text>}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.currentTarget.value)}
                mb="md"
                size="md"
                radius="md"
              />

              <Select 
                label={<Text fw={600} size="xs" c="slate.6" tt="uppercase">Sala / Consultório</Text>}
                data={roomOptions}
                value={selectedRoom}
                onChange={setSelectedRoom}
                size="md"
                radius="md"
              />
              <Text size="xs" c="dimmed" mt="sm">
                A seleção da sala bloqueia o recurso físico no servidor FHIR, evitando choque de horários na rede da clínica.
              </Text>
            </Card>

            <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
              <Title order={6} c="dark.9" fw={700} mb="xs">Resumo do Dia</Title>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Consultas Confirmadas</Text>
                <Badge color="teal" variant="light">8</Badge>
              </Group>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Cancelamentos</Text>
                <Badge color="red" variant="light">1</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Encaixes Disponíveis</Text>
                <Badge color="blue" variant="light">3</Badge>
              </Group>
            </Card>
          </Stack>
        </Grid.Col>

        {/* 3. VISTA DE CALENDARIO MODERNA (TIME SLOTS) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9', minHeight: '500px' }}>
            <Group justify="space-between" mb="lg" pb="md" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <Title order={4} c="dark.9" fw={700}>Horários: {new Date(selectedDate).toLocaleDateString('pt-BR')}</Title>
              <Badge color="dark" size="lg" radius="sm">{selectedRoom}</Badge>
            </Group>

            <Stack gap="sm">
              {/* Slot 08:00 - Ocupado */}
              <Group wrap="nowrap" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                <Text fw={700} w={60} c="dark.9">08:00</Text>
                <Card bg="teal.0" p="sm" radius="md" style={{ flex: 1, borderLeft: '4px solid #14b8a6' }}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={700} size="sm" c="teal.9">Consulta de Retorno - Maria Perez</Text>
                      <Text size="xs" c="teal.8">Telemedicina (Meet) • Agendado por: Recepção</Text>
                    </div>
                    <Avatar color="teal" radius="xl" size="sm">M</Avatar>
                  </Group>
                </Card>
              </Group>

              {/* Slot 09:00 - Libre (Clicable para agendar) */}
              <Group wrap="nowrap" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                <Text fw={700} w={60} c="dimmed">09:00</Text>
                <Card 
                  bg="#f8fafc" p="sm" radius="md" 
                  style={{ flex: 1, border: '1px dashed #cbd5e1', cursor: 'pointer' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Text size="sm" c="dimmed" ta="center" fw={600}>+ Horário Livre (Clique para Agendar)</Text>
                </Card>
              </Group>

              {/* Slot 10:00 - Ocupado */}
              <Group wrap="nowrap" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                <Text fw={700} w={60} c="dark.9">10:00</Text>
                <Card bg="blue.0" p="sm" radius="md" style={{ flex: 1, borderLeft: '4px solid #3b82f6' }}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={700} size="sm" c="blue.9">Avaliação Estética - João da Silva</Text>
                      <Text size="xs" c="blue.8">{selectedRoom} • Agendado por: Paciente (App)</Text>
                    </div>
                    <Avatar color="blue" radius="xl" size="sm">J</Avatar>
                  </Group>
                </Card>
              </Group>
            </Stack>

          </Card>
        </Grid.Col>
      </Grid>

      {/* 4. TABLA INFERIOR: PRÓXIMAS CONSULTAS Y ACCIONES */}
      <Card p={0} radius="lg" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
        <Group p="xl" justify="space-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <Title order={3} c="dark.9" fw={700}>Próximas Consultas & Gestão</Title>
        </Group>
        
        <Table horizontalSpacing="xl" verticalSpacing="md" striped>
          <Table.Thead bg="#f8fafc">
            <Table.Tr>
              <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>DATA / HORA</Table.Th>
              <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>PACIENTE</Table.Th>
              <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>SALA / RECURSO</Table.Th>
              <Table.Th style={{ color: '#64748b', fontSize: '12px' }}>AGENDADO POR</Table.Th>
              <Table.Th style={{ color: '#64748b', fontSize: '12px' }} ta="right">AÇÕES</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {appointments.map((p: any, index: number) => {
              const fullName = p.name ? `${p.name[0].given.join(' ')} ${p.name[0].family}` : 'Paciente ' + index;
              return (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Text fw={700} c="dark.9">28/08/2026</Text>
                    <Text size="xs" c="dimmed">08:00 AM</Text>
                  </Table.Td>
                  <Table.Td fw={600} c="dark.8">{fullName}</Table.Td>
                  <Table.Td>
                    <Badge color="gray" variant="light">{index % 2 === 0 ? 'Telemedicina' : 'Consultório 1'}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dark.7">Secretaria</Text>
                    <Text size="xs" c="dimmed">Ontem, 14:30</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap="xs" justify="flex-end">
                      <Button size="xs" variant="light" color="blue" radius="md">Lembrete</Button>
                      <Button size="xs" variant="light" color="red" radius="md">Cancelar</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* 5. MODAL DE AGENDAMIENTO RÁPIDO */}
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title={<Title order={4}>Agendar Nova Consulta</Title>} size="lg" centered bg="#f8fafc">
        <Stack gap="md">
          <Select label="Selecionar Paciente" placeholder="Busque por nome ou CPF..." data={['Maria Perez', 'João da Silva', 'Lucien Bosco']} searchable />
          <Grid>
            <Grid.Col span={6}>
              <TextInput type="date" label="Data" defaultValue={selectedDate} />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput type="time" label="Hora" defaultValue="09:00" />
            </Grid.Col>
          </Grid>
          <Select label="Sala / Recurso Físico" data={roomOptions} defaultValue={selectedRoom} />
          <Textarea label="Observações / Motivo" placeholder="Ex: Paciente relata dores..." minRows={3} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button color="teal" onClick={() => { alert("Consulta Agendada no Servidor FHIR!"); setIsModalOpen(false); }}>Confirmar Agendamento</Button>
          </Group>
        </Stack>
      </Modal>

    </div>
  );
}