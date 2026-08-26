"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Card, Stack, Tabs, Badge, MantineProvider, Grid
} from '@mantine/core';
import { useMedplum, useMedplumProfile, SignInForm } from '@medplum/react';
import { DynamicIntakeForm } from '../../components/DynamicIntakeForm';

export default function PatientPortal() {
  const profile = useMedplumProfile();
  const medplum = useMedplum();
  const [mounted, setMounted] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [questionnaireSubmitted, setQuestionnaireSubmitted] = useState(false);

  const loadPatientData = useCallback(async () => {
    try {
      const aptBundle = await medplum.search('Appointment', '_sort=-_lastUpdated');
      setAppointments(aptBundle.entry?.map((e: any) => e.resource) || []);

      const cpBundle = await medplum.search('CarePlan', '_sort=-_lastUpdated');
      setCarePlans(cpBundle.entry?.map((e: any) => e.resource) || []);
    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
    }
  }, [medplum]);

  useEffect(() => {
    setMounted(true);
    loadPatientData();
  }, [loadPatientData]);

  if (!profile) {
    return (
      <MantineProvider>
        <Center h="100vh" bg="#f8f9fa">
          <Card shadow="xl" p="xl" radius="md" w={420} withBorder>
            <Title order={3} ta="center" mb="lg" c="grape">Área do Cliente</Title>
            <Text c="dimmed" ta="center" mb="xl" size="sm">Acesse seus agendamentos, tratamentos e histórico estético.</Text>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="grape" /></Center>;

  const patientName = profile.name?.[0]?.given?.[0] || 'Cliente';

  return (
    <MantineProvider theme={{ primaryColor: 'grape' }}>
      <AppShell header={{ height: 60 }} padding="md" bg="#fcfcfc">
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} c="grape">Delchan Health | Espaço VIP</Title>
            <Button variant="subtle" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Sair</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Card shadow="sm" radius="lg" padding="xl" withBorder style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <Group mb="xl" align="center">
              <Avatar color="grape" radius="xl" size="xl">{patientName.charAt(0)}</Avatar>
              <div>
                <Title order={2} c="dark.8">Olá, {patientName} ✨</Title>
                <Text size="md" c="dimmed">Bem-vindo(a) ao seu portal de saúde e bem-estar.</Text>
              </div>
            </Group>

            <Tabs orientation="vertical" defaultValue="appointments" variant="pills" radius="md" color="grape">
              <Tabs.List style={{ minWidth: '220px', borderRight: '1px solid #f1f3f5', paddingRight: '1rem' }}>
                <Tabs.Tab value="appointments">📅 Meus Agendamentos</Tabs.Tab>
                <Tabs.Tab value="careplans">💆‍♀️ Meus Tratamentos</Tabs.Tab>
                <Tabs.Tab value="questionnaire">📋 Ficha Cadastral (Atualizar)</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="appointments" pl="xl">
                <Title order={3} mb="lg" c="dark.7">Próximas Sessões</Title>
                {appointments.length === 0 ? (
                  <Card bg="gray.0" radius="md" ta="center" py="xl">
                    <Text size="md" c="dimmed">Você não possui consultas ou sessões agendadas no momento.</Text>
                    <Button mt="md" variant="light" color="grape">Agendar Nova Sessão</Button>
                  </Card>
                ) : (
                  <Grid>
                    {appointments.map((apt: any) => (
                      <Grid.Col span={{ base: 12, md: 6 }} key={apt.id}>
                        <Card withBorder p="lg" radius="md" shadow="xs">
                          <Group justify="space-between" mb="xs">
                            <Badge color="grape" variant="light">{apt.status === 'booked' ? 'Confirmado' : apt.status}</Badge>
                          </Group>
                          <Text fw={700} size="lg">{apt.description || 'Consulta Estética'}</Text>
                          <Text size="sm" c="dimmed" mt="xs">🗓️ {apt.start ? new Date(apt.start).toLocaleString('pt-BR') : 'Data a definir'}</Text>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="careplans" pl="xl">
                <Title order={3} mb="lg" c="dark.7">Protocolos e Cuidados (Home Care)</Title>
                {carePlans.length === 0 ? (
                  <Text size="md" c="dimmed">Nenhum protocolo ativo registrado.</Text>
                ) : (
                  <Stack>
                    {carePlans.map((cp: any) => (
                      <Card key={cp.id} withBorder p="md" radius="md" bg="grape.0">
                        <Title order={5} c="grape.9">{cp.title || 'Protocolo Clínico'}</Title>
                        <Text size="sm" mt="sm" c="dark.7">{cp.description}</Text>
                        <Group mt="md">
                          <Badge color="green">Status: {cp.status}</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="questionnaire" pl="xl">
                {!questionnaireSubmitted ? (
                  <DynamicIntakeForm 
                    clinicType="advanced_clinic" 
                    medplum={medplum} 
                    // No pasamos initialPatient aquí para simular que el paciente llena sus datos, 
                    // pero en un flujo real podrías pasar profile para pre-llenar.
                    onSuccess={() => setQuestionnaireSubmitted(true)} 
                  />
                ) : (
                  <Card bg="teal.0" p="xl" radius="md" withBorder ta="center">
                    <Title order={3} c="teal.9" mb="sm">Tudo Certo!</Title>
                    <Text fw={500} c="teal.8">Seus dados foram atualizados e sincronizados com a clínica de forma segura (LGPD).</Text>
                  </Card>
                )}
              </Tabs.Panel>
            </Tabs>
          </Card>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}