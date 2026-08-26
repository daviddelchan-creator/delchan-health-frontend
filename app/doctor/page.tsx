"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppShell, Group, Title, Button, Text, Avatar, Loader, Center, Table, Card, Drawer, MantineProvider, Grid } from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { ModernCalendar } from '../../components/ModernCalendar';
import { PatientWorkspace } from '../../components/PatientWorkspace'; // <-- IMPORTAMOS EL WORKSPACE

export default function DoctorPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
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
            <Title order={3} ta="center" mb="lg" c="indigo">Portal do Profissional</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="indigo" /></Center>;

  const doctorName = profile.name?.[0]?.given?.[0] || 'Profissional';

  return (
    <MantineProvider theme={{ primaryColor: 'indigo' }}>
      <AppShell header={{ height: 60 }} padding="md" bg="#f8f9fa">
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} c="indigo">Delchan Health | Workstation Clínico</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Sair</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="indigo" radius="xl" size="lg">{doctorName.charAt(0)}</Avatar>
            <div>
              <Text size="xl" fw={600}>Olá, {doctorName}</Text>
              <Text size="sm" c="dimmed">Gerencie sua agenda e seus atendimentos de forma inteligente.</Text>
            </div>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <ModernCalendar medplum={medplum} patients={patients} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Lista de Pacientes / Clientes</Title>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr><Table.Th>Nome Completo</Table.Th><Table.Th>Documento</Table.Th><Table.Th>Ação</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {patients.map((p: any) => (
                      <Table.Tr key={p.id}>
                        <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family || ''}</Table.Td>
                        <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                        <Table.Td>
                          <Button size="xs" color="indigo" onClick={() => setSelectedPatient(p)}>
                            Abrir Workstation
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>
          </Grid>

          {/* EL DRAWER AHORA ES PANTALLA COMPLETA Y CONTIENE EL WORKSPACE */}
          <Drawer 
            opened={!!selectedPatient} 
            onClose={() => { setSelectedPatient(null); loadPatients(); }} 
            position="right" 
            size="100%" 
            padding={0} 
            withCloseButton={false}
          >
            {selectedPatient && (
              <PatientWorkspace 
                patient={selectedPatient} 
                medplum={medplum} 
                doctorName={doctorName} 
                onClose={() => { setSelectedPatient(null); loadPatients(); }} 
              />
            )}
          </Drawer>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}