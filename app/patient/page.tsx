"use client";

import { useEffect, useState } from 'react';
import { Title, Text, Card, Stack, Group, Badge, ThemeIcon, Grid, Button, Center, Loader } from '@mantine/core';
import { IconCalendarEvent, IconActivity, IconFileDescription, IconDeviceAnalytics } from '@tabler/icons-react';

// This is the new architecture for the dashboard replacing the monolithic old page.tsx
export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Structural simulated fetch targeting the /api/patient/dashboard endpoint
    // In production, this call must pass the Bearer token established during login.
    setTimeout(() => {
      setData({
        appointments: [],
        documents: [],
        diagnostics: [],
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Center h="50vh">
        <Stack align="center">
           <Loader color="teal" />
           <Text c="dimmed">Sincronizando seus dados de saúde...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Card p="xl" radius="md" withBorder>
         <Title order={3} c="red">Não foi possível carregar os dados</Title>
         <Text mt="sm">{error}</Text>
      </Card>
    );
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} c="dark.9">Meu Painel de Saúde</Title>
        <Text c="dimmed">Acompanhe suas consultas, exames e documentos clínicos.</Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon color="teal" size="lg" radius="md" variant="light">
                <IconCalendarEvent size={20} />
              </ThemeIcon>
              <Text fw={700}>Consultas Agendadas</Text>
            </Group>

            {data.appointments.length === 0 ? (
               <Text size="sm" c="dimmed">Você não tem consultas agendadas.</Text>
            ) : (
               <Text size="sm">Renderizando lista de consultas reais...</Text>
            )}

            <Button variant="light" color="teal" fullWidth mt="md" radius="md">
              Agendar Nova Consulta
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon color="blue" size="lg" radius="md" variant="light">
                <IconFileDescription size={20} />
              </ThemeIcon>
              <Text fw={700}>Últimos Documentos</Text>
            </Group>

            {data.documents.length === 0 ? (
               <Text size="sm" c="dimmed">Nenhum documento clínico encontrado.</Text>
            ) : (
               <Text size="sm">Renderizando documentos reais...</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon color="grape" size="lg" radius="md" variant="light">
                <IconDeviceAnalytics size={20} />
              </ThemeIcon>
              <Text fw={700}>Métricas de Saúde</Text>
            </Group>

            <Text size="sm" c="dimmed">
              Sincronização com o Health Connect não configurada no dispositivo Web.
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

    </Stack>
  );
}
