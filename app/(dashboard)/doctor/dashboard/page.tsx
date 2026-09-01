"use client";

import { Container, Title, Grid, Card, Text, Group, ThemeIcon } from '@mantine/core';
import { IconChartBar, IconReportMedical, IconCoin } from '@tabler/icons-react';
import { useTenant } from '../../../../contexts/TenantContext';

export default function DoctorDashboard() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="md" c="dark.9">Dashboard Analítico</Title>
      <Text c="dimmed" mb="xl">Métricas de performance e avaliações em tempo real.</Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed">Receita Bruta</Text>
              <ThemeIcon color="teal" variant="light"><IconCoin size={16} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900}>R$ 14.250,00</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed">Atendimentos</Text>
              <ThemeIcon color="blue" variant="light"><IconReportMedical size={16} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900}>128</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed">Taxa de Retorno</Text>
              <ThemeIcon color="orange" variant="light"><IconChartBar size={16} /></ThemeIcon>
            </Group>
            <Text size="xl" fw={900}>87%</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={12}>
          <Card shadow="sm" p="xl" radius="md" withBorder style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text c="dimmed">Área reservada para o componente de gráficos (Recharts / Chart.js)</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}