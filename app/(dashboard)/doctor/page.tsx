"use client";

import { Title, Text, Card, Grid, Group, Badge, ThemeIcon, Box } from '@mantine/core';
import { IconCurrencyDollar, IconClipboardList, IconTrendingUp } from '@tabler/icons-react';
import { useTenant } from '../../../contexts/TenantContext';

export default function DoctorDashboard() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
      <Title order={2} fw={800} c="dark.9" mb="xs">Dashboard Analítico</Title>
      <Text c="dimmed" size="sm" mb="xl">Métricas de performance e avaliações em tempo real alimentadas pelo CRM e Medplum.</Text>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="lg">
              <Text fw={700} c="dimmed" size="sm">Receita Bruta Mensal</Text>
              <Badge color="teal" variant="light" size="md">+12%</Badge>
            </Group>
            <Title order={1} fw={900}>R$ 15.378,50</Title>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="lg">
              <Text fw={700} c="dimmed" size="sm">Atendimentos Concluídos</Text>
              <ThemeIcon color="blue" variant="light" radius="xl"><IconClipboardList size={18} /></ThemeIcon>
            </Group>
            <Title order={1} fw={900}>142</Title>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card p="xl" radius="lg" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="lg">
              <Text fw={700} c="dimmed" size="sm">Taxa de Retorno de Leads</Text>
              <ThemeIcon color="orange" variant="light" radius="xl"><IconTrendingUp size={18} /></ThemeIcon>
            </Group>
            <Title order={1} fw={900}>87%</Title>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}