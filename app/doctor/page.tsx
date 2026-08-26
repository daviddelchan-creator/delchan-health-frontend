"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar, Loader, Center, Table, Badge, Card, Drawer, MantineProvider, Grid, Stack, Divider, ActionIcon, Alert, ThemeIcon, Checkbox
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { PatientWorkspace } from '../../components/PatientWorkspace';

// Tema Enterprise 2030 (Estilo MediMind / Epic)
const enterpriseTheme = {
  primaryColor: 'blue',
  defaultRadius: 'sm',
  components: {
    Card: { defaultProps: { shadow: 'sm', withBorder: true }, styles: { root: { borderColor: '#e2e8f0', backgroundColor: '#ffffff' } } },
    Button: { defaultProps: { radius: 'sm', fw: 500 } }
  }
};

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
      <MantineProvider theme={enterpriseTheme}>
        <Center h="100vh" bg="#f1f5f9">
          <Card p="xl" w={400} shadow="xl">
            <Center mb="lg"><Title order={2} c="blue.9">Delchan Health</Title></Center>
            <Text c="dimmed" ta="center" mb="xl" size="sm">Acesso Seguro para Profissionais</Text>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="blue" /></Center>;

  const doctorName = profile.name?.[0]?.given?.[0] || 'Dr(a).';

  return (
    <MantineProvider theme={enterpriseTheme}>
      <AppShell header={{ height: 60 }} padding="xl" bg="#f1f5f9"> 
        <AppShell.Header bg="#1e3a8a" style={{ borderBottom: 'none' }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group>
              <ThemeIcon size="lg" radius="md" color="white" variant="light">DH</ThemeIcon>
              <Title order={4} c="white" fw={600}>Delchan Health <Text span c="blue.2" fw={400}>Clinical Hub</Text></Title>
            </Group>
            <Group>
              <Text c="white" size="sm" mr="md">📍 Unidade Principal (São Paulo)</Text>
              <Avatar color="blue.2" radius="xl" size="sm">{doctorName.charAt(0)}</Avatar>
              <Text c="white" size="sm" fw={500}>{doctorName} {profile.name?.[0]?.family}</Text>
              <Button variant="subtle" color="red.3" onClick={() => { medplum.signOut(); window.location.reload(); }} size="xs" ml="md">Sair</Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group justify="space-between" mb="lg">
            <Title order={2} c="dark.8" fw={700}>Dashboard Clínico</Title>
            <Group>
              <Button variant="default" size="sm">⟳ Atualizar</Button>
              <Button color="blue.9" size="sm">+ Nova Anotação Rápida</Button>
            </Group>
          </Group>

          <Stack gap="xs" mb="xl">
            <Alert color="red" variant="light" p="sm" style={{ borderLeft: '4px solid #ef4444' }}>
              <Group gap="xs"><Text fw={700} c="red.9">⚠️ Atenção Crítica:</Text><Text c="red.9">Paciente Maria Silva com risco de anafilaxia (Alergia a Níquel).</Text></Group>
            </Alert>
            <Alert color="orange" variant="light" p="sm" style={{ borderLeft: '4px solid #f97316' }}>
              <Group gap="xs"><Text fw={700} c="orange.9">💊 Interação Medicamentosa:</Text><Text c="orange.9">Revisar prescrição de Isotretinoína na Fila 2.</Text></Group>
            </Alert>
          </Stack>

          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              
              <Grid mb="xl">
                <Grid.Col span={4}>
                  <Card p="md">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">Pacientes em Observação</Text>
                    <Title order={2} c="blue.9">3</Title>
                    <Text size="xs" c="red" fw={600} mt="xs">1 requer atenção imediata</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card p="md">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">Atendimentos Hoje</Text>
                    <Title order={2} c="dark.8">12 / 15</Title>
                    <Text size="xs" c="green" fw={600} mt="xs">80% concluído</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card p="md">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">Laudos Pendentes</Text>
                    <Title order={2} c="orange.6">4</Title>
                    <Text size="xs" c="dimmed" mt="xs">Assinatura digital necessária</Text>
                  </Card>
                </Grid.Col>
              </Grid>

              <Card p={0}>
                <Group p="md" style={{ borderBottom: '1px solid #e2e8f0' }} justify="space-between">
                  <Title order={4} c="dark.8">Próximos Atendimentos (Fila)</Title>
                  <Badge color="blue" variant="light">15 Pacientes</Badge>
                </Group>
                
                <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                  <Table.Thead bg="#f8fafc">
                    <Table.Tr>
                      <Table.Th style={{ color: '#475569', fontSize: '12px' }}>HORÁRIO</Table.Th>
                      <Table.Th style={{ color: '#475569', fontSize: '12px' }}>PACIENTE</Table.Th>
                      <Table.Th style={{ color: '#475569', fontSize: '12px' }}>MOTIVO / PROBLEMA ATIVO</Table.Th>
                      <Table.Th style={{ color: '#475569', fontSize: '12px' }} ta="right">AÇÃO</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {patients.map((p: any, index: number) => (
                      <Table.Tr key={p.id}>
                        <Table.Td><Text fw={600} c="dark.8">14:{index}0</Text></Table.Td>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar color="blue" radius="xl" size="sm">{p.name?.[0]?.given?.[0]}</Avatar>
                            <div>
                              <Text fw={600} size="sm" c="blue.9">{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Text>
                              <Text size="xs" c="dimmed">ID: {p.id?.slice(0,6)} • {p.gender === 'female' ? 'F' : 'M'}</Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="gray" variant="light" size="sm" mb={4}>Acompanhamento</Badge>
                          <Text size="xs" c="dark.6">Avaliação de Peeling Químico</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Button size="xs" color="blue.9" onClick={() => setSelectedPatient(p)}>Abrir Chart</Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="md" mb="xl">
                <Title order={5} c="dark.8" mb="md">Tarefas Clínicas</Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Checkbox label={<Text size="sm" fw={500}>Assinar TCLE - Lizzy Song</Text>} color="blue" />
                    <Badge color="red" variant="dot" size="xs">Urgente</Badge>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Checkbox label={<Text size="sm" fw={500}>Revisar Exames de Sangue</Text>} color="blue" />
                    <Badge color="orange" variant="dot" size="xs">Hoje</Badge>
                  </Group>
                </Stack>
              </Card>

              <Card p="md" bg="#1e3a8a">
                <Title order={5} c="white" mb="sm">Módulo de Telemedicina</Title>
                <Text size="sm" c="blue.2" mb="lg">Você tem 2 consultas virtuais agendadas para o período da tarde.</Text>
                <Button fullWidth color="white" c="blue.9" variant="filled">Acessar Sala Virtual</Button>
              </Card>
            </Grid.Col>
          </Grid>

          <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
            {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={doctorName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />}
          </Drawer>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}