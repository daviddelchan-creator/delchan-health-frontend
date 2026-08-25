"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Modal, TextInput,
  Select, Stack, Drawer, MantineProvider, Checkbox
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { PatientHeader } from '../../components/PatientHeader';
import { SoapNoteForm } from '../../components/SoapNoteForm';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'calendar' | 'settings'>('patients');

  // Estados de Pacientes y Admisión EMPI
  const [patients, setPatients] = useState<any[] | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string | null>('female');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drawer de Expediente
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      const patientList = bundle.entry?.map((e: any) => e.resource) || [];
      setPatients(patientList);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      setPatients([]);
    }
  }, [medplum]);

  useEffect(() => {
    setMounted(true);
    loadPatients();
  }, [loadPatients]);

  const handleCreatePatient = async () => {
    if (!firstName || !lastName || !docNumber || !consentGiven) {
      alert('Por favor complete los campos obligatorios y acepte el consentimiento LGPD.');
      return;
    }
    setIsSubmitting(true);
    try {
      await medplum.createResource({
        resourceType: 'Patient',
        name: [{ given: [firstName], family: lastName }],
        gender: (gender || 'unknown') as 'male' | 'female' | 'other' | 'unknown',
        telecom: [{ system: 'phone', value: phone }],
        identifier: [{ system: 'http://brasil.gov.br/cpf', value: docNumber }],
        active: true
      });
      alert('✅ ¡Paciente registrado con éxito en el EMPI!');
      setIsPatientModalOpen(false);
      setFirstName(''); setLastName(''); setDocNumber(''); setPhone(''); setConsentGiven(false);
      loadPatients();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <MantineProvider>
        <Center h="100vh" bg="#f8f9fa">
          <Card shadow="md" p="xl" radius="md" w={420} withBorder>
            <Title order={3} ta="center" mb="lg" c="teal">Panel Admin - Iniciar Sesión</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) {
    return <Center h="100vh"><Loader color="teal" /></Center>;
  }

  const adminName = profile.name?.[0]?.given?.[0] || 'Administrador';

  return (
    <MantineProvider>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 250, breakpoint: 'sm' }}
        padding="md"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} style={{ color: '#099268' }}>EHR & EMPI SaaS | Panel Administrativo (São Paulo)</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">
              Cerrar Sesión
            </Button>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Text fw={700} size="sm" c="dimmed" mb="sm">MENÚ EMPRESARIAL</Text>
          <Button
            variant={activeTab === 'patients' ? 'light' : 'subtle'}
            color="teal" fullWidth justify="flex-start" mb="sm"
            onClick={() => setActiveTab('patients')}
          >
            👥 Gestión de Pacientes
          </Button>
          <Button
            variant={activeTab === 'calendar' ? 'light' : 'subtle'}
            color="teal" fullWidth justify="flex-start" mb="sm"
            onClick={() => setActiveTab('calendar')}
          >
            📅 Agenda, Salas y Teams / Google
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'light' : 'subtle'}
            color="teal" fullWidth justify="flex-start"
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Configuración Multi-Tenant
          </Button>
        </AppShell.Navbar>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="teal" radius="xl" size="lg">{adminName.charAt(0).toUpperCase()}</Avatar>
            <div>
              <Text size="xl" fw={600}>Bienvenido, {adminName}</Text>
              <Text size="sm" c="dimmed">São Paulo, SP - Brasil | Control Centralizado</Text>
            </div>
          </Group>

          {/* VISTA 1: GESTIÓN DE PACIENTES */}
          {activeTab === 'patients' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3}>Índice Maestro de Pacientes (EMPI)</Title>
                <Button color="teal" radius="md" onClick={() => setIsPatientModalOpen(true)}>
                  + Nueva Admisión EMPI
                </Button>
              </Group>

              {!patients ? (
                <Center py="xl"><Loader color="teal" /></Center>
              ) : patients.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">No hay pacientes registrados.</Text>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Nombre Completo</Table.Th>
                      <Table.Th>CPF / Pasaporte</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {patients.map((p: any) => (
                      <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedPatient(p); setIsDrawerOpen(true); }}>
                        <Table.Td>{p.id?.slice(0, 8)}</Table.Td>
                        <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Table.Td>
                        <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                        <Table.Td><Badge color="teal">ACTIVO</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          )}

          {/* VISTA 2: CALENDARIO, SALAS Y RECURSOS CORPORATIVOS */}
          {activeTab === 'calendar' && (
            <AppointmentCalendar medplum={medplum} />
          )}

          {/* VISTA 3: CONFIGURACIÓN MULTI-TENANT */}
          {activeTab === 'settings' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Configuración de Marca y Suscripción SaaS</Title>
              <Text c="dimmed" mb="lg">Administre los colores, logotipos y dominios personalizados para cada clínica cliente.</Text>
              <TextInput label="Nombre de la Clínica" defaultValue="Cosmetologia e Estética Leoneybis" mb="md" />
              <TextInput label="URL del Logotipo" defaultValue="https://via.placeholder.com/150" mb="md" />
              <Button color="teal">Guardar Cambios de Marca</Button>
            </Card>
          )}

          {/* MODAL DE NUEVA ADMISIÓN EMPI */}
          <Modal opened={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Admisión EMPI (Brasil)" centered>
            <Stack>
              <TextInput label="Nombre" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
              <TextInput label="Apellido" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
              <TextInput label="CPF / Pasaporte" placeholder="000.000.000-00" value={docNumber} onChange={(e) => setDocNumber(e.currentTarget.value)} required />
              <TextInput label="Teléfono" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
              <Select label="Género" data={[{value: 'female', label: 'Feminino'}, {value: 'male', label: 'Masculino'}]} value={gender} onChange={setGender} />
              <Checkbox label="Consentimiento LGPD y protección de datos en Brasil." checked={consentGiven} onChange={(e) => setConsentGiven(e.currentTarget.checked)} mt="sm" />
              <Button color="teal" fullWidth mt="md" onClick={handleCreatePatient} loading={isSubmitting}>Guardar Admisión FHIR</Button>
            </Stack>
          </Modal>

          {/* DRAWER DE EXPEDIENTE CON BARRA LATERAL Y SOAP */}
          <Drawer opened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} position="right" size="xl" title={<Badge color="teal">Expediente Clínico Electrónico (EHR)</Badge>}>
            {selectedPatient && (
              <Group align="flex-start" grow preventGrowOverflow={false}>
                <PatientHeader patient={selectedPatient} />
                <SoapNoteForm patient={selectedPatient} medplum={medplum} />
              </Group>
            )}
          </Drawer>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}