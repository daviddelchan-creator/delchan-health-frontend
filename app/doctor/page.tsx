"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Drawer, Stack, MantineProvider, Divider, Grid, Modal
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { PatientHeader } from '../../components/PatientHeader';
import { SoapNoteForm } from '../../components/SoapNoteForm';
import { DigitalSignaturePad } from '../../components/DigitalSignaturePad';
import { ModernCalendar } from '../../components/ModernCalendar';
import { DynamicIntakeForm } from '../../components/DynamicIntakeForm'; // <-- IMPORTAMOS EL FORMULARIO

export default function DoctorPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Estados para la Edición de Clientes
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<any | null>(null);
  
  // Nivel de la clínica (En un SaaS real esto se lee del perfil del Tenant)
  const [clinicConfig] = useState<'salon' | 'spa' | 'advanced_clinic'>('advanced_clinic');

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Error al cargar pacientes/clientes:", error);
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
            <Title order={3} ta="center" mb="lg" c="blue">Portal Médico - Iniciar Sesión</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="blue" /></Center>;

  const doctorName = profile.name?.[0]?.given?.[0] || 'Profesional';

  return (
    <MantineProvider>
      <AppShell header={{ height: 60 }} padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} style={{ color: '#1971c2' }}>EHR Enterprise | Espacio del Profesional</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Cerrar Sesión</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="blue" radius="xl" size="lg">{doctorName.charAt(0).toUpperCase()}</Avatar>
            <div>
              <Text size="xl" fw={600}>{doctorName}</Text>
              <Text size="sm" c="dimmed">Panel de Control: Agenda, Clientes y Evoluciones</Text>
            </div>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <ModernCalendar medplum={medplum} patients={patients} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Listado de Clientes / Pacientes</Title>
                {patients.length === 0 ? <Center py="xl"><Loader color="blue" /></Center> : (
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr><Table.Th>Nombre Completo</Table.Th><Table.Th>Documento</Table.Th><Table.Th>Acción</Table.Th></Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {patients.map((p: any) => (
                        <Table.Tr key={p.id}>
                          <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family || ''}</Table.Td>
                          <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                          <Table.Td>
                            <Button size="xs" color="blue" onClick={() => { setSelectedPatient(p); setIsDrawerOpen(true); }}>
                              Abrir Ficha
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Card>
            </Grid.Col>
          </Grid>

          {/* Modal de Edición */}
          <Modal opened={isPatientModalOpen} onClose={() => { setIsPatientModalOpen(false); setPatientToEdit(null); }} title="Actualización de Ficha" centered size="xl" bg="#f8f9fa">
            <DynamicIntakeForm 
              clinicType={clinicConfig} 
              medplum={medplum} 
              initialPatient={patientToEdit}
              onSuccess={() => { setIsPatientModalOpen(false); setPatientToEdit(null); loadPatients(); }} 
            />
          </Modal>

          <Drawer opened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} position="right" size="100%" padding="xl" title={<Badge color="blue" size="lg">Expediente Oficial</Badge>}>
            {selectedPatient && (
              <Group align="flex-start" grow preventGrowOverflow={false}>
                <Stack>
                  <PatientHeader patient={selectedPatient} />
                  
                  {/* BOTÓN PARA EDITAR */}
                  <Button variant="outline" color="blue" onClick={() => { setPatientToEdit(selectedPatient); setIsPatientModalOpen(true); }}>
                    ✏️ Editar Datos del Cliente / Paciente
                  </Button>

                </Stack>
                <Stack>
                  <SoapNoteForm patient={selectedPatient} medplum={medplum} />
                  <Divider my="sm" />
                  <DigitalSignaturePad patient={selectedPatient} doctorName={doctorName} medplum={medplum} />
                </Stack>
              </Group>
            )}
          </Drawer>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}