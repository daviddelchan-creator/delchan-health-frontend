"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Group, Title, Button, Text, Avatar, Loader, Center, Table, Badge, Card, Drawer, Grid, ThemeIcon, Stack
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { PatientWorkspace } from '../../../components/PatientWorkspace';

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
    } catch (error) { setPatients([]); }
  }, [medplum]);

  useEffect(() => { setMounted(true); loadPatients(); }, [loadPatients]);

  if (!mounted || !profile) return <Center h="80vh"><Loader color="teal" /></Center>;

  const doctorName = profile.name?.[0]?.given?.[0] || 'Alberto';

  // Fecha actual formateada
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* CABECERA: Saludo y Fecha */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Bom dia, Dr. {doctorName}</Title>
          <Text c="dimmed" size="md">Aqui está o resumo da sua clínica hoje.</Text>
        </div>
        <Button variant="default" radius="md" leftSection="📅" color="gray">
          {today}
        </Button>
      </Group>

      {/* TARJETAS DE MÉTRICAS (Big Numbers) */}
      <Grid gutter="lg" mb="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Consultas Hoje</Text>
                <Title order={1} c="dark.9" fw={800} style={{ fontSize: '3.2rem', lineHeight: 1 }}>24</Title>
              </div>
              <ThemeIcon size={50} radius="xl" color="blue.0" c="blue.6"><Text size="xl">📅</Text></ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed" mt="lg" fw={500}><Text span c="teal.6" fw={700}>↗ +12%</Text> vs. ontem</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Novos Pacientes</Text>
                <Title order={1} c="dark.9" fw={800} style={{ fontSize: '3.2rem', lineHeight: 1 }}>8</Title>
              </div>
              <ThemeIcon size={50} radius="xl" color="teal.0" c="teal.6"><Text size="xl">👤</Text></ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed" mt="lg" fw={500}><Text span c="teal.6" fw={700}>↗ +4%</Text> esta semana</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" bg="white">
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

      {/* SECCIÓN INFERIOR: Tabla y Alertas */}
      <Grid gutter="lg">
        
        {/* TABLA DE PRÓXIMOS ATENDIMIENTOS */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p={0} radius="lg" bg="white">
            <Group p="xl" justify="space-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Title order={3} c="dark.9" fw={700}>Próximos Atendimentos</Title>
              <Button variant="subtle" color="teal" size="sm">Ver todos →</Button>
            </Group>
            
            <Table horizontalSpacing="xl" verticalSpacing="md">
              <Table.Thead bg="#f8fafc">
                <Table.Tr>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>HORÁRIO</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>PACIENTE</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>PROCEDIMENTO</Table.Th>
                  <Table.Th style={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>STATUS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {patients.slice(0, 4).map((p: any, index: number) => {
                  const times = ['09:00', '09:30', '10:15', '11:00'];
                  const procedures = ['Consulta Retorno', 'Exame Rotina', 'Primeira Consulta', 'Acompanhamento'];
                  const statusColors = ['blue', 'teal', 'red', 'blue'];
                  const statusLabels = ['Agendado', 'Atendido', 'Cancelado', 'Agendado'];

                  return (
                    <Table.Tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedPatient(p)}>
                      <Table.Td fw={700} c="dark.9">{times[index] || '12:00'}</Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar color="teal.1" c="teal.8" radius="xl" size="sm" fw={700}>{p.name?.[0]?.given?.[0]}</Avatar>
                          <Text fw={600} size="sm" c="dark.9">{p.name?.[0]?.given?.join(' ')} {p.name?.[0]?.family}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dark.7" fw={500}>{procedures[index] || 'Consulta'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={statusColors[index] || 'blue'} variant="light" size="sm" radius="sm" fw={700}>
                          {statusLabels[index] || 'Agendado'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        {/* TARJETA OSCURA DE ALERTAS CLÍNICAS */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card radius="lg" bg="#0f172a" c="white" p="xl" h="100%">
            <Group gap="sm" mb="xl">
              <Text size="xl" c="teal.4">📈</Text>
              <Title order={3} fw={700}>Alerta Clínico</Title>
            </Group>

            <Stack gap="md">
              <Card bg="#1e293b" radius="md" p="md" style={{ borderLeft: '4px solid #ef4444', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon color="red.9" variant="light" radius="sm">⚠️</ThemeIcon>
                  <div>
                    <Text fw={700} size="sm" c="white">Exame Pendente</Text>
                    <Text size="xs" c="slate.4" mt={4} lh={1.4}>Paciente João Alves necessita revisão de hemograma antes da próxima sessão.</Text>
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