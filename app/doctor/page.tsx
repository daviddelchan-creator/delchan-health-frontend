"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Drawer, Stack, MantineProvider
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { PatientHeader } from '../../components/PatientHeader';
import { SoapNoteForm } from '../../components/SoapNoteForm';

export default function DoctorPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[] | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      const patientList = bundle.entry?.map((e: any) => e.resource) || [];
      setPatients(patientList);
    } catch (error) {
      console.error("Error al cargar pacientes para el médico:", error);
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

  if (!mounted) {
    return <Center h="100vh"><Loader color="blue" /></Center>;
  }

  const doctorName = profile.name?.[0]?.given?.[0] || 'Doctor(a)';

  return (
    <MantineProvider>
      <AppShell header={{ height: 60 }} padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} style={{ color: '#1971c2' }}>EHR Enterprise | Vista Médico (São Paulo)</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">
              Cerrar Sesión
            </Button>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="blue" radius="xl" size="lg">{doctorName.charAt(0).toUpperCase()}</Avatar>
            <div>
              <Text size="xl" fw={600}>Dr(a). {doctorName}</Text>
              <Text size="sm" c="dimmed">Panel Clínico y Agenda de Especialistas</Text>
            </div>
          </Group>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">Listado de Pacientes Asignados</Title>
            
            {!patients ? (
              <Center py="xl"><Loader color="blue" /></Center>
            ) : patients.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No hay pacientes registrados en el sistema actualmente.</Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Nombre Completo</Table.Th>
                    <Table.Th>Documento (CPF / Pasaporte)</Table.Th>
                    <Table.Th>Acción Clínica</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {patients.map((p: any) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.id?.slice(0, 8)}</Table.Td>
                      <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family || ''}</Table.Td>
                      <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                      <Table.Td>
                        <Button size="xs" color="blue" onClick={() => { setSelectedPatient(p); setIsDrawerOpen(true); }}>
                          Abrir Expediente y SOAP
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>

          {/* EXPEDIENTE CLÍNICO INTEGRAL CON BARRA LATERAL Y FORMULARIO SOAP */}
          <Drawer
            opened={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            position="right"
            size="xl"
            title={<Badge color="blue">Historia Clínica Electrónica (EHR)</Badge>}
          >
            {selectedPatient && (
              <Group align="flex-start" grow preventGrowOverflow={false}>
                {/* BARRA LATERAL MODERNA DEL PACIENTE */}
                <PatientHeader patient={selectedPatient} />

                {/* FORMULARIO DE EVOLUCIÓN CLÍNICA SOAP */}
                <Stack>
                  <SoapNoteForm patient={selectedPatient} medplum={medplum} />
                </Stack>
              </Group>
            )}
          </Drawer>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}