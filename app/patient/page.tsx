"use client";

import { useEffect, useState } from 'react';
import { Title, Text, Card, Stack, Group, Badge, ThemeIcon, Grid, Button, Center, Loader } from '@mantine/core';
import { IconCalendarEvent, IconActivity, IconFileDescription, IconDeviceAnalytics, IconAlertTriangle } from '@tabler/icons-react';

// This is the new architecture for the dashboard replacing the monolithic old page.tsx
export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The underlying Layout has already established proper bounds check on identity.
    // In future iterations, standard SWR or React Query hooks should be used to pull pre-hydrated layout data downwards natively.
    const attemptDataFetch = async () => {
       try {
          const res = await fetch('/api/patient/dashboard', {
             headers: {
                'Authorization': `Bearer ${typeof localStorage !== 'undefined' ? localStorage.getItem('medplum-token') || '' : ''}`
             }
          });

          if (res.status === 401 || res.status === 403) {
             setError('Acesso negado. Sessão inválida.');
             setLoading(false);
             return;
          }

          if (!res.ok) {
             throw new Error('Falha ao sincronizar prontuário digital');
          }

          const json = await res.json();
          setData(json);
       } catch (err: any) {
          setError(err.message || 'Houve um problema de conexão com o servidor.');
       } finally {
          setLoading(false);
       }
    };

    attemptDataFetch();
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

  if (error || !data) {
    return (
      <Center h="50vh">
         <Stack align="center" ta="center">
            <ThemeIcon size={64} radius="xl" variant="light" color="red">
               <IconAlertTriangle size={32} />
            </ThemeIcon>
            <Title order={3} c="dark.9" mt="sm">Não foi possível carregar os dados</Title>
            <Text c="dimmed" maw={400}>{error || 'Os dados do portal requerem uma sessão autenticada real conectada ao backend clínico.'}</Text>
         </Stack>
      </Center>
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

            {(!data.appointments || data.appointments.length === 0) ? (
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

            {(!data.documents || data.documents.length === 0) ? (
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
