"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar, Loader, Center, Table, Badge, Card, Modal, Stack, Drawer, MantineProvider, Grid, ThemeIcon, NavLink, RingProgress, MantineColorsTuple, Select, TextInput, FileButton, Switch
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { DynamicIntakeForm } from '../../components/DynamicIntakeForm';
import { PatientWorkspace } from '../../components/PatientWorkspace';
import { AppointmentCalendar } from '../../components/AppointmentCalendar';
import { PractitionerForm } from '../../components/PractitionerForm';

const slateColors: MantineColorsTuple = [
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', 
  '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'
];

const enterpriseTheme = {
  primaryColor: 'slate',
  colors: { slate: slateColors },
  defaultRadius: 'sm',
  components: {
    Card: { defaultProps: { shadow: 'sm', withBorder: true }, styles: { root: { borderColor: '#e2e8f0', backgroundColor: '#ffffff' } } },
    Button: { defaultProps: { radius: 'sm', fw: 500 } }
  }
};

export default function AdminPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'financial' | 'settings' | 'calendar' | 'staff'>('dashboard');
  const [clinicConfig, setClinicConfig] = useState<'salon' | 'spa' | 'advanced_clinic'>('advanced_clinic');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { setPatients([]); }
  }, [medplum]);

  useEffect(() => { setMounted(true); loadPatients(); }, [loadPatients]);

  if (!profile) {
    return (
      <MantineProvider theme={enterpriseTheme}>
        <Center h="100vh" bg="#f1f5f9">
          <Card p="xl" w={400} shadow="xl">
            <Center mb="lg"><Title order={2} c="slate.9">System Admin</Title></Center>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="slate" /></Center>;
  const adminName = profile.name?.[0]?.given?.[0] || 'Admin';

  return (
    <MantineProvider theme={enterpriseTheme}>
      <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'sm' }} bg="#f1f5f9">
        
        <AppShell.Header bg="#0f172a" style={{ borderBottom: 'none' }}>
          <Group h="100%" px="xl" justify="space-between">
            <Group>
              <ThemeIcon size="md" radius="sm" color="slate.7"><Text fw={900}>DH</Text></ThemeIcon>
              <Title order={4} c="white" fw={600}>Delchan Health <Text span c="slate.4" fw={400}>Enterprise</Text></Title>
            </Group>
            <Group>
              <Button variant="default" size="xs" color="dark">🌍 All Branches</Button>
              <Button variant="default" size="xs" color="dark">🇧🇷 PT-BR</Button>
              <Avatar color="slate.4" radius="xl" size="sm">{adminName.charAt(0)}</Avatar>
              <Text c="white" size="sm" fw={500}>System Admin</Text>
              <Button variant="subtle" color="red.3" onClick={() => { medplum.signOut(); window.location.reload(); }} size="xs" ml="sm">Sair</Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar bg="white" style={{ borderRight: '1px solid #e2e8f0' }}>
          <Stack gap={0} mt="md">
            <Text fw={700} size="xs" c="slate.5" px="md" mb="sm" tt="uppercase" style={{ letterSpacing: '1px' }}>Categorias</Text>
            <NavLink label="Visão Geral (Dashboard)" leftSection={<Text size="lg">📊</Text>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} fw={500} color="slate.9" />
            <NavLink label="Operações Clínicas" leftSection={<Text size="lg">🏥</Text>} active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} fw={500} color="slate.9" />
            <NavLink label="Gestão Financeira" leftSection={<Text size="lg">💳</Text>} active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} fw={500} color="slate.9" />
            <NavLink label="Gestão de Salas" leftSection={<Text size="lg">📅</Text>} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} fw={500} color="slate.9" />
            <NavLink label="Equipe (Profissionais)" leftSection={<Text size="lg">👩‍⚕️</Text>} active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} fw={500} color="slate.9" />
            <NavLink label="Configuração do Sistema" leftSection={<Text size="lg">⚙️</Text>} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} fw={500} color="slate.9" />
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main p="xl">
          <Group justify="space-between" mb="xl">
            <Title order={2} c="slate.9" fw={700}>
              {activeTab === 'dashboard' && 'Command Center'}
              {activeTab === 'patients' && 'Operações Clínicas (EMPI)'}
              {activeTab === 'financial' && 'Centro de Faturamento'}
              {activeTab === 'calendar' && 'Gestão de Salas'}
              {activeTab === 'staff' && 'Profissionais'}
              {activeTab === 'settings' && 'Módulos do Sistema'}
            </Title>
          </Group>

          {activeTab === 'dashboard' && (
            <Grid gutter="xl">
              <Grid.Col span={8}>
                <Card p="xl">
                  <Title order={5} c="slate.9" mb="lg">Fluxo de Caixa Mensal</Title>
                  <Grid>
                    <Grid.Col span={4}>
                      <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Receitas Brutas</Text>
                      <Title order={2} c="green.7">R$ 142.500</Title>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Despesas Fixas/Variáveis</Text>
                      <Title order={2} c="red.6">R$ 58.200</Title>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text c="slate.5" size="xs" tt="uppercase" fw={700}>Lucro Líquido (EBITDA)</Text>
                      <Title order={2} c="slate.9">R$ 84.300</Title>
                    </Grid.Col>
                  </Grid>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={4}>
                <Card p="lg" ta="center">
                  <Title order={5} c="slate.9" mb="md">Ocupação da Clínica</Title>
                  <Group justify="center">
                    <RingProgress size={120} thickness={12} roundCaps sections={[{ value: 78, color: 'blue' }]} label={<Text ta="center" fw={700} size="xl">78%</Text>} />
                  </Group>
                  <Text size="sm" c="slate.5" mt="sm">Capacidade Operacional</Text>
                </Card>
              </Grid.Col>
            </Grid>
          )}

          {activeTab === 'patients' && (
            <Card p={0}>
              <Group p="md" justify="space-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Text fw={600} c="slate.9">Base de Pacientes</Text>
                <Button color="slate.9" size="sm" onClick={() => setIsNewPatientModalOpen(true)}>+ Registrar Paciente</Button>
              </Group>
              <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="#f8fafc">
                  <Table.Tr>
                    <Table.Th style={{ color: '#475569', fontSize: '12px' }}>NOME COMPLETO</Table.Th>
                    <Table.Th style={{ color: '#475569', fontSize: '12px' }}>DOCUMENTO</Table.Th>
                    <Table.Th style={{ color: '#475569', fontSize: '12px' }} ta="right">AÇÃO</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {patients.map((p: any) => (
                    <Table.Tr key={p.id}>
                      <Table.Td fw={600} c="slate.9">{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Table.Td>
                      <Table.Td><Text size="sm" c="slate.5">{p.identifier?.[0]?.value || 'N/A'}</Text></Table.Td>
                      <Table.Td ta="right">
                        <Button size="xs" variant="outline" color="slate.9" onClick={() => setSelectedPatient(p)}>Gerenciar Ficha</Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {activeTab === 'financial' && (
            <Stack gap="xl">
              <Card padding="xl" bg="white">
                <Group justify="space-between" mb="lg">
                  <Title order={3} c="dark.8">Painel de Faturamento (Billing)</Title>
                  <Group>
                    <Text size="sm" fw={600}>Habilitar emissão de Nota Fiscal (NFS-e)</Text>
                    <Switch color="blue" defaultChecked />
                  </Group>
                </Group>
                <Text size="sm" c="dimmed" mb="xl">Configure os códigos de faturamento padrão e monitore as receitas vinculadas aos atendimentos (Orders-linked billing).</Text>
                
                <Card withBorder radius="md" bg="#f9fafb" p={0}>
                  <Table verticalSpacing="md" horizontalSpacing="lg">
                    <Table.Thead bg="white">
                      <Table.Tr>
                        <Table.Th style={{ color: '#6b7280' }}>Código / Procedimento</Table.Th>
                        <Table.Th style={{ color: '#6b7280' }}>Qtd.</Table.Th>
                        <Table.Th style={{ color: '#6b7280' }}>Código de Diagnóstico (CID)</Table.Th>
                        <Table.Th style={{ color: '#6b7280' }} ta="right">Valor (R$)</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <Table.Td>
                          <Text fw={600} c="dark.8">99393</Text>
                          <Text size="xs" c="dimmed">Avaliação Facial Preventiva / Consulta Básica</Text>
                        </Table.Td>
                        <Table.Td>1</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge color="blue" variant="light" size="sm">Primário</Badge>
                            <Text size="sm" c="dimmed">Z00.129</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right" fw={600}>R$ 150,00</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>
                          <Text fw={600} c="dark.8">96127</Text>
                          <Text size="xs" c="dimmed">Procedimento a Laser / Microagulhamento</Text>
                        </Table.Td>
                        <Table.Td>1</Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">L70.0 (Acne vulgar)</Text>
                        </Table.Td>
                        <Table.Td ta="right" fw={600}>R$ 450,00</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Card>
              </Card>

              <Card padding="xl" bg="white">
                <Title order={4} c="dark.8" mb="lg">Histórico de Pagamentos Recentes (Payment history)</Title>
                <Stack gap="md">
                  <Card withBorder p="md" radius="md">
                    <Group justify="space-between">
                      <div>
                        <Text fw={600} size="sm">25/08/2026</Text>
                        <Text size="xs" c="dimmed">Pix Copia e Cola • Paciente: Maria Silva</Text>
                        <Text size="xs" c="dimmed">Pacote: Limpeza de Pele Profunda</Text>
                      </div>
                      <Group>
                        <Title order={4} c="dark.8">R$ 250,00</Title>
                        <Badge color="green" variant="filled">Pago</Badge>
                      </Group>
                    </Group>
                  </Card>
                </Stack>
              </Card>
            </Stack>
          )}

          {activeTab === 'calendar' && <AppointmentCalendar medplum={medplum} />}
          {activeTab === 'staff' && <PractitionerForm medplum={medplum} onSuccess={() => alert("Profissional registrado com sucesso.")} />}

          {activeTab === 'settings' && (
            <Grid gutter="lg">
              {[
                { title: "Estrutura da Clínica", desc: "Filiais e departamentos", icon: "🏢" },
                { title: "Personalização (White-label)", desc: "Cores e Logomarca", icon: "🎨" },
                { title: "Modelos de Formulários", desc: "Anamnese e TCLE", icon: "📝" },
                { title: "Conexão Google Calendar", desc: "API OAuth2", icon: "📅" }
              ].map((module, i) => (
                <Grid.Col span={4} key={i}>
                  <Card p="lg" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                    <Text size="xl" mb="sm">{module.icon}</Text>
                    <Title order={5} c="slate.9">{module.title}</Title>
                    <Text size="sm" c="slate.5" mt="xs">{module.desc}</Text>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}

          <Modal opened={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} title={<Title order={4}>Novo Registro</Title>} centered size="xl" bg="#f1f5f9">
            <DynamicIntakeForm clinicType={clinicConfig} medplum={medplum} onSuccess={() => { setIsNewPatientModalOpen(false); loadPatients(); }} />
          </Modal>

          <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
            {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={adminName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />}
          </Drawer>

        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}