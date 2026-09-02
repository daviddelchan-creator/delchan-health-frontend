"use client";

import { Container, Title, Grid, Card, Text, Group, ThemeIcon, Progress, Stack, Badge, Table, Button } from '@mantine/core';
import { IconChartBar, IconReportMedical, IconCoin, IconTrendingUp, IconUsers, IconCalendarCheck, IconArrowUpRight } from '@tabler/icons-react';
import { useTenant } from '@/contexts/TenantContext';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
  const router = useRouter();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs" c="dark.9" fw={800}>Dashboard Executivo & Métricas</Title>
          <Text c="dimmed" size="sm">Performance clínica, indicadores financeiros e fluxo de pacientes.</Text>
        </div>
        <Button color={primaryColor} radius="xl" onClick={() => router.push('/doctor')}>
          Voltar ao Painel Geral
        </Button>
      </Group>

      {/* CARDS SUPERIORES */}
      <Grid gutter="lg" mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="xs" p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Receita Líquida</Text>
              <ThemeIcon color="teal" variant="light" radius="xl"><IconCoin size={18} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900} c="dark.9">R$ 28.450,00</Text>
            <Badge color="teal" variant="light" size="xs" mt="xs">+18% vs mês anterior</Badge>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="xs" p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Total Consultas</Text>
              <ThemeIcon color="blue" variant="light" radius="xl"><IconReportMedical size={18} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900} c="dark.9">142</Text>
            <Badge color="blue" variant="light" size="xs" mt="xs">94% presença</Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="xs" p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Taxa de Retorno</Text>
              <ThemeIcon color="grape" variant="light" radius="xl"><IconTrendingUp size={18} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900} c="dark.9">89%</Text>
            <Badge color="grape" variant="light" size="xs" mt="xs">Meta clínica: 80%</Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card shadow="xs" p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Novos Pacientes</Text>
              <ThemeIcon color="orange" variant="light" radius="xl"><IconUsers size={18} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900} c="dark.9">38</Text>
            <Badge color="orange" variant="light" size="xs" mt="xs">+7 esta semana</Badge>
          </Card>
        </Grid.Col>
      </Grid>

      {/* DETALHAMENTO DE PERFORMANCE */}
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Title order={4} mb="md" c="dark.9">Procedimentos Mais Realizados</Title>
            <Stack gap="md">
              {[
                { name: 'Consulta Dermatológica / Avaliação', count: 54, pct: 75, color: 'teal' },
                { name: 'Aplicação de Toxina Botulínica (Botox)', count: 32, pct: 50, color: 'blue' },
                { name: 'Bioestimulador de Colágeno', count: 24, pct: 38, color: 'grape' },
                { name: 'Preenchimento com Ácido Hialurônico', count: 18, pct: 28, color: 'orange' },
                { name: 'Retorno Clínico de Rotina', count: 14, pct: 22, color: 'cyan' },
              ].map((proc, idx) => (
                <div key={idx}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={600} c="dark.8">{proc.name}</Text>
                    <Text size="xs" fw={700} c="dimmed">{proc.count} sessões</Text>
                  </Group>
                  <Progress value={proc.pct} color={proc.color} radius="xl" size="sm" />
                </div>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Title order={4} mb="md" c="dark.9">Ocupação Semanal dos Consultórios</Title>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>CONSULTÓRIO</Table.Th>
                  <Table.Th>OCUPAÇÃO</Table.Th>
                  <Table.Th>STATUS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  { name: 'Consultório 1 (Dermatologia)', pct: 92, status: 'Alta Demanda', color: 'teal' },
                  { name: 'Consultório 2 (Estética Facial)', pct: 85, status: 'Ideal', color: 'blue' },
                  { name: 'Sala de Procedimentos / Laser', pct: 68, status: 'Disponível', color: 'orange' },
                  { name: 'Cabine Telemedicina', pct: 95, status: 'Alta Demanda', color: 'teal' },
                ].map((item, i) => (
                  <Table.Tr key={i}>
                    <Table.Td fw={700} c="dark.8">{item.name}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Progress value={item.pct} color={item.color} w={80} radius="xl" size="xs" />
                        <Text size="xs" fw={700}>{item.pct}%</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={item.color} variant="light" size="xs">{item.status}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}