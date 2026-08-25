"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Modal, TextInput,
  Select, Stack, Drawer, MantineProvider
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { PatientHeader } from '../../components/PatientHeader';
import { SoapNoteForm } from '../../components/SoapNoteForm';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { DynamicIntakeForm } from '../../components/DynamicIntakeForm';

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'calendar' | 'settings'>('patients');

  // Tipo de suscripción SaaS (Módulo Dinámico)
  const [clinicConfig, setClinicConfig] = useState<'salon' | 'spa' | 'advanced_clinic'>('advanced_clinic');

  const [patients, setPatients] = useState<any[] | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
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

  if (!mounted) return <Center h="100vh"><Loader color="teal" /></Center>;

  const adminName = profile.name?.[0]?.given?.[0] || 'Administrador';

  return (
    <MantineProvider>
      <AppShell header={{ height: 60 }} navbar={{ width: 250, breakpoint: 'sm' }} padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} style={{ color: '#099268' }}>EHR & EMPI SaaS | Panel Administrativo (São Paulo)</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Cerrar Sesión</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Text fw={700} size="sm" c="dimmed" mb="sm">MENÚ EMPRESARIAL</Text>
          <Button variant={activeTab === 'patients' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('patients')}>👥 Gestión de Pacientes</Button>
          <Button variant={activeTab === 'calendar' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" mb="sm" onClick={() => setActiveTab('calendar')}>📅 Agenda y Salas VIP</Button>
          <Button variant={activeTab === 'settings' ? 'light' : 'subtle'} color="teal" fullWidth justify="flex-start" onClick={() => setActiveTab('settings')}>⚙️ Configuración SaaS</Button>
        </AppShell.Navbar>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="teal" radius="xl" size="lg">{adminName.charAt(0).toUpperCase()}</Avatar>
            <div>
              <Text size="xl" fw={600}>Bienvenido, {adminName}</Text>
              <Text size="sm" c="dimmed">São Paulo, SP - Brasil | Control Centralizado SaaS</Text>
            </div>
          </Group>

          {activeTab === 'patients' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3}>Índice Maestro de Pacientes (EMPI)</Title>
                <Button color="teal" radius="md" onClick={() => setIsPatientModalOpen(true)}>+ Nueva Admisión EMPI</Button>
              </Group>

              {!patients ? <Center py="xl"><Loader color="teal" /></Center> : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr><Table.Th>ID</Table.Th><Table.Th>Nombre Completo</Table.Th><Table.Th>CPF / Pasaporte</Table.Th><Table.Th>Estado</Table.Th></Table.Tr>
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

          {activeTab === 'calendar' && <AppointmentCalendar medplum={medplum} />}

          {activeTab === 'settings' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Configuración de Marca y Suscripción SaaS</Title>
              <Select 
                label="Tipo de Suscripción (Nivel de Formularios)"
                value={clinicConfig}
                onChange={(val: any) => setClinicConfig(val)}
                data={[
                  { value: 'salon', label: 'Básico (Salón de Belleza)' },
                  { value: 'spa', label: 'Intermedio (SPA Estético)' },
                  { value: 'advanced_clinic', label: 'Avanzado (Clínica / Cosmetología Láser)' }
                ]}
                mb="md"
              />
              <TextInput label="Nombre de la Clínica Inquilina" defaultValue="Cosmetologia e Estética Leoneybis" mb="md" />
              <Button color="teal">Guardar Cambios de Marca</Button>
            </Card>
          )}

          {/* Modal con Formulario Dinámico Integrado */}
          <Modal opened={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Registro Inteligente" centered size="lg" bg="#f8f9fa">
            <DynamicIntakeForm 
              clinicType={clinicConfig} 
              medplum={medplum} 
              onSuccess={() => { setIsPatientModalOpen(false); loadPatients(); }} 
            />
          </Modal>

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