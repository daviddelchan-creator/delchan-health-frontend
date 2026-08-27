"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Avatar, Loader, Center, Table, Badge, Card, Drawer, Grid, ThemeIcon, Stack, ActionIcon, Menu
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { PatientWorkspace } from '../../../components/PatientWorkspace';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../../../contexts/TenantContext';

export default function DoctorPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  
  // EXTRAEMOS LA MAGIA DEL DICCIONARIO
  const { dict } = useTenant();

  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      const bundle = await medplum.search('Patient', '_sort=-_lastUpdated');
      setPatients(bundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) { setPatients([]); }
  }, [medplum]);

  useEffect(() => { setMounted(true); loadPatients(); }, [loadPatients]);

  if (!mounted || !profile) return <Center h="80vh"><Loader color="teal" /></Center>;

  const doctorName = profile.name?.[0]?.given?.[0] || 'Alberto';
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Group justify="space-between" mb="xl">
        <div>
          {/* TÍTULO DINÁMICO */}
          <Title order={1} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Bom dia, {dict.doctor} {doctorName}</Title>
          <Text c="dimmed" size="md">Aqui está o resumo da sua operação hoje.</Text>
        </div>
        <Button variant="default" radius="md" leftSection="📅" color="gray">
          {today}
        </Button>
      </Group>

      <Grid gutter="lg" mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white" shadow="xs" withBorder style={{ borderColor: '#f1f5f9' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">{dict.appointment}s Hoje</Text>
                <Title order={1} c="dark.9" fw={800} style={{ fontSize: '3.2rem', lineHeight: 1 }}>24</Title>
              </div>
              <ThemeIcon size={50} radius="xl" color="blue.0" c="blue.6"><Text size="xl">📅</Text></ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed" mt="lg" fw={500}><Text span c="teal.6" fw={700}>↗ +12%</Text> vs. ontem</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white" shadow="xs" withBorder style={{ borderColor: '#f1f5f9' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Novos {dict.patient}s</Text>
                <Title order={1} c="dark.9" fw={800} style={{ fontSize: '3.2rem', lineHeight: 1 }}>8</Title>
              </div>
              <ThemeIcon size={50} radius="xl" color="teal.0" c="teal.6"><Text size="xl">👤</Text></ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed" mt="lg" fw={500}><Text span c="teal.6" fw={700}>↗ +4%</Text> esta semana</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white" shadow="xs" withBorder style={{ borderColor: '#f1f5f9' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Faturamento (Mês)</Text>
                <Title order={1} c="dark.9" fw={800} style={{ fontSize: '2.5rem', lineHeight: 1, marginTop: '8px' }}>R$ 45.2K</Title>
              </div>
              <ThemeIcon size={50} radius="xl" color="grape.0" c="grape.6"><Text size="xl">💳</Text></ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed" mt="md" fw={500}><Text span c="red.5" fw={700}>↘ -2%</Text> vs. mês anterior</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p={0} radius="lg" bg="white" shadow="xs" withBorder style={{ borderColor: '#f1f5f9' }}>
            <Group p="xl" justify="space-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Title order={3} c="dark.9" fw={700}>Próximos {dict.appointment}s</Title>
              <Button variant="subtle" color="teal" size="sm">Ver todos →</Button>
            </Group>
            
            <Table horizontalSpacing="xl" verticalSpacing="md">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>HORÁRIO</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>{dict.patient.toUpperCase()}</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>PROCEDIMENTO</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }} ta="right">AÇÃO</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {patients.slice(0, 4).map((p: any, index: number) => {
                  const times = ['09:00', '09:30', '10:15', '11:00'];
                  const procedures = [`${dict.appointment} de Retorno`, 'Avaliação', `Primeira ${dict.appointment}`, 'Acompanhamento'];
                  const statusColors = ['blue', 'teal', 'red', 'blue'];
                  const statusLabels = ['Agendado', 'Atendido', 'Cancelado', 'Agendado'];

                  return (
                    <Table.Tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <Table.Td fw={700} c="dark.9">{times[index] || '12:00'}</Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar color="teal.1" c="teal.8" radius="xl" size="sm" fw={700}>{p.name?.[0]?.given?.[0]}</Avatar>
                          <Text fw={600} size="sm" c="dark.9">{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dark.7" fw={500}>{procedures[index] || dict.appointment}</Text>
                        <Badge color={statusColors[index] || 'blue'} variant="light" size="xs" radius="sm" fw={700} mt={4}>
                          {statusLabels[index] || 'Agendado'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <Menu shadow="md" width={250} position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="light" color="gray" size="lg" radius="md">
                                <Text size="md">🖨️</Text>
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>Fluxo Híbrido (QR Code)</Menu.Label>
                              <Menu.Item onClick={() => alert(`Gerando ${dict.chart} Física com QR...`)}>Imprimir {dict.chart}</Menu.Item>
                              <Menu.Divider />
                              <Menu.Item c="teal.7" onClick={() => alert("Aguardando scanner...")} leftSection="📸">Escanear Documento</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                          
                          <Button size="xs" color="teal" radius="md" onClick={() => setSelectedPatient(p)}>Abrir {dict.chart}</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card radius="lg" bg="#0f172a" c="white" p="xl" h="100%">
            <Group gap="sm" mb="xl">
              <Text size="xl" c="teal.4">📈</Text>
              <Title order={3} fw={700}>Alertas do Sistema</Title>
            </Group>

            <Stack gap="md">
              <Card bg="#1e293b" radius="md" p="md" style={{ borderLeft: '4px solid #ef4444', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon color="red.9" variant="light" radius="sm">⚠️</ThemeIcon>
                  <div>
                    <Text fw={700} size="sm" c="white">Ação Pendente</Text>
                    <Text size="xs" c="slate.4" mt={4} lh={1.4}>{dict.patient} João Alves necessita revisar o TCLE antes da próxima {dict.appointment}.</Text>
                  </div>
                </Group>
              </Card>

              <Card bg="#1e293b" radius="md" p="md" style={{ borderLeft: '4px solid #14b8a6', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon color="teal.9" variant="light" radius="sm">ℹ️</ThemeIcon>
                  <div>
                    <Text fw={700} size="sm" c="white">Atualização de Sistema</Text>
                    <Text size="xs" c="slate.4" mt={4} lh={1.4}>Novo módulo de faturamento disponível. Acesse as configurações.</Text>
                  </div>
                </Group>
              </Card>
            </Stack>

            <Button fullWidth variant="subtle" color="slate.3" mt="xl" fw={600}>
              Ver Todos Alertas
            </Button>
          </Card>
        </Grid.Col>
      </Grid>

      <Drawer opened={!!selectedPatient} onClose={() => { setSelectedPatient(null); loadPatients(); }} position="right" size="100%" padding={0} withCloseButton={false}>
        {selectedPatient && <PatientWorkspace patient={selectedPatient} medplum={medplum} doctorName={doctorName} onClose={() => { setSelectedPatient(null); loadPatients(); }} />}
      </Drawer>
    </div>
  );
}