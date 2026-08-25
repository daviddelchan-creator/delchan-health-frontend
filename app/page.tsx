"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Burger, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Modal, TextInput,
  Select, Stack, Drawer, Divider, MantineProvider, Textarea, Tabs, Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';

// DICCIONARIO MULTIIDIOMA
const translations = {
  es: {
    title: "EHR & EMPI SaaS Enterprise",
    welcome: "Bienvenido",
    patients: "Pacientes",
    carePlans: "Planes de Cuidado",
    appointments: "Agenda / Citas",
    settings: "Configuración",
    medicalPortal: "Vista Médico",
    patientPortal: "Portal del Paciente",
    newPatient: "+ Nueva Admisión EMPI",
    newAppointment: "+ Agendar Cita",
    newCarePlan: "+ Crear Plan de Cuidado",
    logout: "Cerrar Sesión"
  },
  pt: {
    title: "EHR & EMPI SaaS Enterprise",
    welcome: "Bem-vindo",
    patients: "Pacientes",
    carePlans: "Planos de Cuidado",
    appointments: "Agenda / Consultas",
    settings: "Configuração",
    medicalPortal: "Visão Médico",
    patientPortal: "Portal do Paciente",
    newPatient: "+ Nova Admissão EMPI",
    newAppointment: "+ Agendar Consulta",
    newCarePlan: "+ Novo Plano de Cuidado",
    logout: "Sair"
  },
  en: {
    title: "EHR & EMPI SaaS Enterprise",
    welcome: "Welcome",
    patients: "Patients",
    carePlans: "Care Plans",
    appointments: "Appointments",
    settings: "Settings",
    medicalPortal: "Doctor View",
    patientPortal: "Patient Portal",
    newPatient: "+ New EMPI Admission",
    newAppointment: "+ New Appointment",
    newCarePlan: "+ New Care Plan",
    logout: "Sign Out"
  }
};

export default function HomePage() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [lang, setLang] = useState<'es' | 'pt' | 'en'>('pt');
  const t = translations[lang];

  if (!profile) {
    return (
      <MantineProvider>
        <Center h="100vh" bg="#f8f9fa">
          <Card shadow="md" p="xl" radius="md" w={420} withBorder>
            <Title order={3} ta="center" mb="lg" c="teal">{t.title}</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider>
      <DashboardContent profile={profile} medplum={medplum} lang={lang} setLang={setLang} t={t} />
    </MantineProvider>
  );
}

function DashboardContent({ profile, medplum, lang, setLang, t }: any) {
  const [opened, { toggle }] = useDisclosure();
  const [mounted, setMounted] = useState(false);

  // Selector de Rol Global para simular la vista Admin, Médico o Paciente
  const [userRole, setUserRole] = useState<'admin' | 'doctor' | 'patient'>('admin');
  const [activeTab, setActiveTab] = useState<'patients' | 'careplans' | 'appointments' | 'settings' | 'doctorView' | 'patientPortal'>('patients');

  // Estados de Pacientes, Citas y CarePlans
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string | null>('female');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCarePlanModalOpen, setIsCarePlanModalOpen] = useState(false);
  const [cpPatientId, setCpPatientId] = useState<string | null>('');
  const [cpTitle, setCpTitle] = useState('Protocolo Estético Facial / Harmonização');
  const [cpDescription, setCpDescription] = useState('Seguimiento de sesiones y cuidados domiciliarios.');

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [aptPatientId, setAptPatientId] = useState<string | null>('');
  const [aptPractitioner, setAptPractitioner] = useState('Dra. Leoneybis Estefany');
  const [aptDate, setAptDate] = useState('');
  const [aptDescription, setAptDescription] = useState('Consulta de evaluación y procedimiento');

  // Datos FHIR
  const [patients, setPatients] = useState<any[] | null>(null);
  const [carePlans, setCarePlans] = useState<any[] | null>([]);
  const [appointments, setAppointments] = useState<any[] | null>([]);

  // Drawer de Expediente Médico
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [soapNotes, setSoapNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const patientBundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(patientBundle.entry?.map((e: any) => e.resource) || []);

      const cpBundle = await medplum.search('CarePlan', '_sort=-_lastUpdated');
      setCarePlans(cpBundle.entry?.map((e: any) => e.resource) || []);

      const aptBundle = await medplum.search('Appointment', '_sort=-_lastUpdated');
      setAppointments(aptBundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Error al cargar datos FHIR:", error);
    }
  }, [medplum]);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

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
        gender,
        telecom: [{ system: 'phone', value: phone }],
        identifier: [{ system: 'http://brasil.gov.br/cpf', value: docNumber }],
        active: true
      });
      alert('✅ ¡Paciente registrado con éxito!');
      setIsPatientModalOpen(false);
      setFirstName(''); setLastName(''); setDocNumber(''); setPhone(''); setConsentGiven(false);
      loadData();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSoapNote = async () => {
    if (!selectedPatient) return;
    try {
      await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: { text: 'Nota de Evolución SOAP' },
        subject: { reference: `Patient/${selectedPatient.id}` },
        conclusion: soapNotes
      });
      alert('✅ ¡Nota de evolución clínica guardada en el expediente FHIR!');
      setSoapNotes('');
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  if (!mounted) {
    return <Center h="100vh"><Loader color="teal" /></Center>;
  }

  let adminName = profile.name?.[0]?.given?.[0] || 'Administrador';
  const patientSelectOptions = patients?.map(p => ({
    value: p.id,
    label: `${p.name?.[0]?.given?.[0] || ''} ${p.name?.[0]?.family || ''} (CPF: ${p.identifier?.[0]?.value || 'N/A'})`
  })) || [];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      style={{ backgroundColor: '#f8f9fa' }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} style={{ color: '#099268' }}>{t.title}</Title>
          </Group>
          <Group>
            {/* SELECTOR DE VISTA / ROL PARA PRUEBAS SAAS */}
            <Select
              size="xs"
              w={150}
              value={userRole}
              onChange={(val: any) => setUserRole(val || 'admin')}
              data={[
                { value: 'admin', label: '👑 Vista Admin' },
                { value: 'doctor', label: '🩺 Vista Médico' },
                { value: 'patient', label: '👤 Portal Paciente' }
              ]}
            />
            <Select
              size="xs"
              w={110}
              value={lang}
              onChange={(val: any) => setLang(val || 'pt')}
              data={[
                { value: 'es', label: 'Español' },
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' }
              ]}
            />
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">
              {t.logout}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text fw={700} size="sm" c="dimmed" mb="sm">NAVEGACIÓN SAAS</Text>
        
        {userRole === 'admin' && (
          <>
            <Button variant={activeTab === 'patients' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('patients')}>👥 {t.patients}</Button>
            <Button variant={activeTab === 'careplans' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('careplans')}>📋 {t.carePlans}</Button>
            <Button variant={activeTab === 'appointments' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('appointments')}>📅 {t.appointments}</Button>
            <Button variant={activeTab === 'settings' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" onClick={() => setActiveTab('settings')}>⚙️ {t.settings}</Button>
          </>
        )}

        {userRole === 'doctor' && (
          <>
            <Button variant="light" color="blue" fullWidth justify="flex-start" mb="sm">🩺 Agenda del Médico</Button>
            <Button variant="subtle" color="gray" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('patients')}>📁 Historias Clínicas (EHR)</Button>
            <Button variant="subtle" color="gray" fullWidth justify="flex-start">💊 Recetas & Protocolos</Button>
          </>
        )}

        {userRole === 'patient' && (
          <>
            <Button variant="light" color="grape" fullWidth justify="flex-start" mb="sm">🏠 Mi Historial de Salud</Button>
            <Button variant="subtle" color="gray" fullWidth justify="flex-start" mb="sm">📅 Mis Citas Agendadas</Button>
            <Button variant="subtle" color="gray" fullWidth justify="flex-start">📝 Cuestionario de Admisión</Button>
          </>
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Group mb="xl" align="center">
          <Avatar color={userRole === 'admin' ? 'teal' : userRole === 'doctor' ? 'blue' : 'grape'} radius="xl" size="lg">{adminName.charAt(0).toUpperCase()}</Avatar>
          <div>
            <Text size="xl" fw={600}>{t.welcome}, {adminName} ({userRole.toUpperCase()})</Text>
            <Text size="sm" c="dimmed">São Paulo, SP - Brasil | Módulo Activo: {userRole}</Text>
          </div>
        </Group>

        {/* --- VISTA ADMINISTRATIVA --- */}
        {userRole === 'admin' && activeTab === 'patients' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>{t.patients}</Title>
              <Button color="teal" radius="md" onClick={() => setIsPatientModalOpen(true)}>{t.newPatient}</Button>
            </Group>
            {!patients ? <Center py="xl"><Loader color="teal" /></Center> : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr><Table.Th>ID</Table.Th><Table.Th>Nombre</Table.Th><Table.Th>CPF</Table.Th><Table.Th>Estado</Table.Th></Table.Tr>
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

        {userRole === 'admin' && activeTab === 'careplans' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Planes de Cuidado</Title>
              <Button color="teal" onClick={() => setIsCarePlanModalOpen(true)}>{t.newCarePlan}</Button>
            </Group>
            <Table striped>
              <Table.Thead><Table.Tr><Table.Th>ID</Table.Th><Table.Th>Título</Table.Th><Table.Th>Estado</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {carePlans?.map((cp: any) => (
                  <Table.Tr key={cp.id}><Table.Td>{cp.id?.slice(0, 8)}</Table.Td><Table.Td>{cp.title}</Table.Td><Table.Td><Badge color="green">{cp.status}</Badge></Table.Td></Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {userRole === 'admin' && activeTab === 'appointments' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Agenda y Citas</Title>
              <Button color="teal" onClick={() => setIsAptModalOpen(true)}>{t.newAppointment}</Button>
            </Group>
            <Table striped>
              <Table.Thead><Table.Tr><Table.Th>ID</Table.Th><Table.Th>Descripción</Table.Th><Table.Th>Fecha</Table.Th><Table.Th>Estado</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {appointments?.map((apt: any) => (
                  <Table.Tr key={apt.id}><Table.Td>{apt.id?.slice(0, 8)}</Table.Td><Table.Td>{apt.description}</Table.Td><Table.Td>{apt.start ? new Date(apt.start).toLocaleString() : 'N/A'}</Table.Td><Table.Td><Badge color="blue">{apt.status}</Badge></Table.Td></Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {/* --- VISTA MÉDICO / ESPECIALISTA --- */}
        {userRole === 'doctor' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">Panel del Especialista / Médico</Title>
            <Text c="dimmed" mb="lg">Aquí visualizas tu agenda sincronizada con los recursos de la clínica y puedes redactar notas de evolución clínica directamente en los expedientes de tus pacientes.</Text>
            <Table striped>
              <Table.Thead><Table.Tr><Table.Th>Paciente</Table.Th><Table.Th>CPF</Table.Th><Table.Th>Acción Médica</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {patients?.map((p: any) => (
                  <Table.Tr key={p.id}>
                    <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Table.Td>
                    <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                    <Table.Td>
                      <Button size="xs" color="blue" onClick={() => { setSelectedPatient(p); setIsDrawerOpen(true); }}>Abrir Historia Clínica</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {/* --- PORTAL DEL PACIENTE --- */}
        {userRole === 'patient' && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">Portal del Paciente</Title>
            <Text c="dimmed" mb="lg">Bienvenido a tu espacio personal de salud. Aquí puedes consultar tus próximas citas con los especialistas, verificar tus planes de cuidado y actualizar tus datos de contacto.</Text>
            <Card withBorder p="md" bg="#f1f3f5">
              <Text fw={600}>Próxima Cita Programada:</Text>
              <Text size="sm" c="dimmed">Dra. Leoneybis Estefany - Tratamiento Estético (São Paulo)</Text>
            </Card>
          </Card>
        )}

        {/* MODAL DE PACIENTES */}
        <Modal opened={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Admisión EMPI (Brasil)" centered>
          <Stack>
            <TextInput label="Nombre" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
            <TextInput label="Apellido" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
            <TextInput label="CPF" placeholder="000.000.000-00" value={docNumber} onChange={(e) => setDocNumber(e.currentTarget.value)} required />
            <TextInput label="Teléfono" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
            <Checkbox label="Consentimiento LGPD" checked={consentGiven} onChange={(e) => setConsentGiven(e.currentTarget.checked)} mt="sm" />
            <Button color="teal" fullWidth mt="md" onClick={handleCreatePatient} loading={isSubmitting}>Guardar Paciente</Button>
          </Stack>
        </Modal>

        {/* MODAL DE CAREPLAN */}
        <Modal opened={isCarePlanModalOpen} onClose={() => setIsCarePlanModalOpen(false)} title="Crear Plan de Cuidado" centered>
          <Stack>
            <Select label="Paciente" data={patientSelectOptions} value={cpPatientId} onChange={setCpPatientId} required />
            <TextInput label="Título" value={cpTitle} onChange={(e) => setCpTitle(e.currentTarget.value)} required />
            <Textarea label="Descripción" value={cpDescription} onChange={(e) => setCpDescription(e.currentTarget.value)} />
            <Button color="teal" fullWidth mt="md" onClick={async () => {
              await medplum.createResource({ resourceType: 'CarePlan', status: 'active', intent: 'plan', subject: { reference: `Patient/${cpPatientId}` }, title: cpTitle, description: cpDescription });
              alert('✅ Creado'); setIsCarePlanModalOpen(false); loadData();
            }}>Guardar CarePlan</Button>
          </Stack>
        </Modal>

        {/* MODAL DE CITA */}
        <Modal opened={isAptModalOpen} onClose={() => setIsAptModalOpen(false)} title="Agendar Cita con Especialista" centered>
          <Stack>
            <Select label="Paciente" data={patientSelectOptions} value={aptPatientId} onChange={setAptPatientId} required />
            <Select label="Especialista" data={[{ value: 'Dra. Leoneybis Estefany', label: 'Dra. Leoneybis Estefany' }]} value={aptPractitioner} onChange={(val) => setAptPractitioner(val || '')} required />
            <TextInput type="datetime-local" label="Fecha y Hora" value={aptDate} onChange={(e) => setAptDate(e.currentTarget.value)} required />
            <TextInput label="Procedimiento" value={aptDescription} onChange={(e) => setAptDescription(e.currentTarget.value)} required />
            <Button color="teal" fullWidth mt="md" onClick={async () => {
              await medplum.createResource({ resourceType: 'Appointment', status: 'booked', description: aptDescription, start: new Date(aptDate).toISOString(), participant: [{ actor: { reference: `Patient/${aptPatientId}` }, status: 'accepted' }] });
              alert('✅ Cita agendada'); setIsAptModalOpen(false); loadData();
            }}>Confirmar Cita</Button>
          </Stack>
        </Modal>

        {/* DRAWER DE HISTORIA CLÍNICA (EHR / SOAP) */}
        <Drawer opened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} position="right" size="lg" title={<Badge color="blue">Expediente Médico EHR / SOAP</Badge>}>
          {selectedPatient && (
            <Stack>
              <Title order={3}>{selectedPatient.name?.[0]?.given?.join(' ')} {selectedPatient.name?.[0]?.family}</Title>
              <Text size="sm" c="dimmed">CPF: {selectedPatient.identifier?.[0]?.value || 'N/A'}</Text>
              <Divider my="sm" />
              <Title order={5}>Notas de Evolución (SOAP)</Title>
              <Textarea placeholder="Escriba Subjetivo, Objetivo, Análisis y Plan..." minRows={6} value={soapNotes} onChange={(e) => setSoapNotes(e.currentTarget.value)} />
              <Button color="blue" onClick={handleSaveSoapNote}>Guardar Nota Médica en FHIR</Button>
            </Stack>
          )}
        </Drawer>
      </AppShell.Main>
    </AppShell>
  );
}