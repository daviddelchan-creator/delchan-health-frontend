"use client";

import { Title, Text, Card, Grid, Group, Badge, Avatar, Table, Button, Stack, ActionIcon } from '@mantine/core';
import { useTenant } from '../../../contexts/TenantContext';

export default function DoctorDashboard() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig.internalColor || '#0d9488';

  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} fw={800} c="dark.9" style={{ letterSpacing: '-0.5px' }}>Bom dia, Dr. Medplum</Title>
          <Text c="dimmed" size="sm" mt={4}>Aqui está o resumo da sua operação hoje.</Text>
        </div>
        <Badge size="lg" variant="default" radius="xl" leftSection="📅" color="gray" style={{ textTransform: 'none', fontWeight: 600 }}>
          {today}
        </Badge>
      </Group>

      {/* KPIs */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }} shadow="sm">
            <Group justify="space-between" mb="lg">
              <Text size="xs" fw={700} c="dimmed">ATENDIMENTOS HOJE</Text>
              <ActionIcon variant="light" color="blue" radius="xl" size="lg">📅</ActionIcon>
            </Group>
            <Title order={1} fw={900} size="3rem">24</Title>
            <Group gap="xs" mt="md">
              <Badge color="teal" variant="light">+12%</Badge>
              <Text size="xs" c="dimmed">vs. ontem</Text>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }} shadow="sm">
            <Group justify="space-between" mb="lg">
              <Text size="xs" fw={700} c="dimmed">NOVOS PACIENTES</Text>
              <ActionIcon variant="light" color="grape" radius="xl" size="lg">👤</ActionIcon>
            </Group>
            <Title order={1} fw={900} size="3rem">8</Title>
            <Group gap="xs" mt="md">
              <Badge color="teal" variant="light">+4%</Badge>
              <Text size="xs" c="dimmed">esta semana</Text>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }} shadow="sm">
            <Group justify="space-between" mb="lg">
              <Text size="xs" fw={700} c="dimmed">FATURAMENTO (MÊS)</Text>
              <ActionIcon variant="light" color="indigo" radius="xl" size="lg">💳</ActionIcon>
            </Group>
            <Title order={1} fw={900} size="2.5rem">R$ 45.2K</Title>
            <Group gap="xs" mt="md">
              <Badge color="red" variant="light">-2%</Badge>
              <Text size="xs" c="dimmed">vs. mês anterior</Text>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* SECCIÓN INFERIOR: Agenda y Alertas */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card p="xl" radius="20px" withBorder style={{ borderColor: '#e2e8f0' }} shadow="sm">
            <Group justify="space-between" mb="xl">
              <Title order={4} fw={700}>Próximos Agendamentos</Title>
              <Button variant="subtle" color="teal" size="sm">Ver todos &rarr;</Button>
            </Group>
            
            <Table verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th c="dimmed" fw={600} fz="xs">HORÁRIO</Table.Th>
                  <Table.Th c="dimmed" fw={600} fz="xs">PACIENTE</Table.Th>
                  <Table.Th c="dimmed" fw={600} fz="xs">PROCEDIMENTO</Table.Th>
                  <Table.Th c="dimmed" fw={600} fz="xs" ta="right">AÇÃO</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  { time: '09:00', name: 'MARIA PEREZ', proc: 'Consulta de Retorno', status: 'AGENDADO' },
                  { time: '09:30', name: 'Lucien Bosco', proc: 'Avaliação Estética', status: 'AGUARDANDO' },
                  { time: '10:15', name: 'Juliana Rios', proc: 'Primeira Consulta', status: 'AGENDADO' }
                ].map((item, i) => (
                  <Table.Tr key={i}>
                    <Table.Td fw={700} c="dark.9">{item.time}</Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="teal" radius="xl" size="sm">{item.name.charAt(0)}</Avatar>
                        <Text fw={600} size="sm">{item.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{item.proc}</Text>
                      <Badge size="xs" variant="light" color={item.status === 'AGUARDANDO' ? 'orange' : 'blue'}>{item.status}</Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Button size="xs" color={primaryColor} radius="md">Abrir Prontuário</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="20px" bg="#0f172a" c="white" shadow="sm">
            <Group gap="sm" mb="xl">
              <Text size="xl">📈</Text>
              <Title order={4} fw={700}>Alertas do Sistema</Title>
            </Group>

            <Stack gap="md">
              <Card p="md" radius="md" bg="#1e293b" style={{ borderLeft: '4px solid #f59e0b' }}>
                <Group gap="sm" align="flex-start">
                  <Text size="lg">⚠️</Text>
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="sm" c="white">Ação Pendente</Text>
                    <Text size="xs" c="gray.4" mt={4}>Paciente João Alves necessita revisar o TCLE antes da próxima sessão.</Text>
                  </div>
                </Group>
              </Card>

              <Card p="md" radius="md" bg="#1e293b" style={{ borderLeft: '4px solid #3b82f6' }}>
                <Group gap="sm" align="flex-start">
                  <Text size="lg">ℹ️</Text>
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="sm" c="white">Atualização de Sistema</Text>
                    <Text size="xs" c="gray.4" mt={4}>Novo módulo de faturamento TISS disponível no painel de configurações.</Text>
                  </div>
                </Group>
              </Card>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}