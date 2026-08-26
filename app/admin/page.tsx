"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Table, Badge, Card, Modal, TextInput,
  Select, Stack, Drawer, MantineProvider, Grid
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { DynamicIntakeForm } from '../../components/DynamicIntakeForm';
import { PractitionerForm } from '../../components/PractitionerForm';
import { PatientWorkspace } from '../../components/PatientWorkspace'; // <-- USAMOS EL MISMO WORKSPACE

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'patients' | 'calendar' | 'staff' | 'settings'>('patients');
  const [clinicConfig, setClinicConfig] = useState<'salon' | 'spa' | 'advanced_clinic'>('advanced_clinic');

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  
  // Modal SOLO para crear pacientes nuevos
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

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
            <Title order={3} ta="center" mb="lg" c="teal">Painel Administrativo</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="teal" /></Center>;

  const adminName = profile.name?.[0]?.given?.[0] || 'Administrador';

  return (
    <MantineProvider theme={{ primaryColor: 'teal' }}>
      <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'sm' }} padding="md" bg="#f8f9fa">
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} c="teal">Delchan Health | Gestão e EMPI (São Paulo)</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Sair</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md" bg="white">
          <Text fw={700} size="xs" c="dimmed" mb="sm" tt="uppercase">Menu Corporativo</Text>
          <Stack gap="xs">
            <Button variant={activeTab === 'patients' ? 'light' : 'subtle'} color="teal" justify="flex-start" onClick={() => setActiveTab('patients')}>
              👥 Gestão de Clientes
            </Button>
            <Button variant={activeTab === 'calendar' ? 'light' : 'subtle'} color="teal" justify="flex-start" onClick={() => setActiveTab('calendar')}>
              📅 Agenda e Salas VIP
            </Button>
            <Button variant={activeTab === 'staff' ? 'light' : 'subtle'} color="teal" justify="flex-start" onClick={() => setActiveTab('staff')}>
              👩‍⚕️ Equipe e Profissionais
            </Button>
            <Button variant={activeTab === 'settings' ? 'light' : 'subtle'} color="teal" justify="flex-start" onClick={() => setActiveTab('settings')}>
              ⚙️ Configuração SaaS
            </Button>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="teal" radius="xl" size="lg">{adminName.charAt(0)}</Avatar>
            <div>
              <Text size="xl" fw={600}>Bem-vindo(a), {adminName}</Text>
              <Text size="sm" c="dimmed">Controle Centralizado de Operações e Faturamento</Text>
            </div>
          </Group>

          {activeTab === 'patients' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3} c="dark.7">Índice Mestre de Clientes (EMPI)</Title>
                <Button color="teal" radius="md" onClick={() => setIsNewPatientModalOpen(true)}>
                  + Nova Admissão
                </Button>
              </Group>

              {patients.length === 0 ? <Center py="xl"><Loader color="teal" /></Center> : (
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr><Table.Th>ID</Table.Th><Table.Th>Nome Completo</Table.Th><Table.Th>Documento</Table.Th><Table.Th>Ação</Table.Th></Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {patients.map((p: any) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.id?.slice(0, 8)}</Table.Td>
                        <Table.Td fw={500}>{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Table.Td>
                        <Table.Td>{p.identifier?.[0]?.value || 'N/A'}</Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" color="teal" onClick={() => setSelectedPatient(p)}>
                            Abrir Workstation
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          )}

          {activeTab === 'calendar' && <AppointmentCalendar medplum={medplum} />}
          {activeTab === 'staff' && <PractitionerForm medplum={medplum} onSuccess={() => alert("Profissional registrado com sucesso.")} />}

          {activeTab === 'settings' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Branding e Assinatura SaaS</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Select label="Nível da Clínica (Módulos)" value={clinicConfig} onChange={(val: any) => setClinicConfig(val)} data={[{ value: 'salon', label: 'Básico (Salão de Beleza)' }, { value: 'spa', label: 'Intermediário (SPA Estético)' }, { value: 'advanced_clinic', label: 'Avançado (Clínica Médica/Estética)' }]} mb="md" />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Nome Fantasia da Clínica" defaultValue="Cosmetologia e Estética Leoneybis" mb="md" />
                </Grid.Col>
              </Grid>
              <Button color="teal">Salvar Configurações</Button>
            </Card>
          )}

          {/* Modal SOMENTE para Cadastro de Novos Pacientes */}
          <Modal opened={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} title={<Title order={4}>Novo Registro de Cliente</Title>} centered size="xl" bg="#f8f9fa">
            <DynamicIntakeForm clinicType={clinicConfig} medplum={medplum} onSuccess={() => { setIsNewPatientModalOpen(false); loadPatients(); }} />
          </Modal>

          {/* Workstation Integrado para Edição, Caixa e Anamnese */}
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
                doctorName={adminName} 
                onClose={() => { setSelectedPatient(null); loadPatients(); }} 
              />
            )}
          </Drawer>

        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}