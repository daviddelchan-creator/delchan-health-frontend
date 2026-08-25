"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Group, Title, Button, Text, Avatar,
  Loader, Center, Card, Stack, Tabs, Badge, MantineProvider
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
      console.error("Error al cargar datos del portal de paciente:", error);
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
          <Card shadow="md" p="xl" radius="md" w={420} withBorder>
            <Title order={3} ta="center" mb="lg" c="grape">Portal del Paciente - Iniciar Sesión</Title>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  if (!mounted) return <Center h="100vh"><Loader color="grape" /></Center>;

  const patientName = profile.name?.[0]?.given?.[0] || 'Paciente';

  return (
    <MantineProvider>
      <AppShell header={{ height: 60 }} padding="md" style={{ backgroundColor: '#f8f9fa' }}>
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={4} style={{ color: '#845ef7' }}>Portal de Salud del Paciente (São Paulo)</Title>
            <Button variant="light" color="red" onClick={() => { medplum.signOut(); window.location.reload(); }} size="sm">Cerrar Sesión</Button>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group mb="xl" align="center">
            <Avatar color="grape" radius="xl" size="lg">{patientName.charAt(0).toUpperCase()}</Avatar>
            <div>
              <Text size="xl" fw={600}>Hola, {patientName}</Text>
              <Text size="sm" c="dimmed">Bienvenido a su espacio personal de salud y bienestar</Text>
            </div>
          </Group>

          <Tabs defaultValue="appointments">
            <Tabs.List mb="md">
              <Tabs.Tab value="appointments">📅 Mis Citas</Tabs.Tab>
              <Tabs.Tab value="careplans">📋 Mis Planes de Atención</Tabs.Tab>
              <Tabs.Tab value="questionnaire">📝 Formulario Inteligente</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="appointments">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Próximas Citas</Title>
                {appointments.length === 0 ? <Text size="sm" c="dimmed">No tiene citas agendadas.</Text> : (
                  <Stack>
                    {appointments.map((apt: any) => (
                      <Card key={apt.id} withBorder p="sm" radius="md">
                        <Group justify="space-between">
                          <div>
                            <Text fw={600}>{apt.description || 'Consulta Estética'}</Text>
                            <Text size="sm" c="dimmed">Fecha: {apt.start ? new Date(apt.start).toLocaleString() : 'N/A'}</Text>
                          </div>
                          <Badge color="grape">{apt.status}</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="careplans">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Protocolos de Cuidado</Title>
                {carePlans.length === 0 ? <Text size="sm" c="dimmed">No hay planes activos.</Text> : (
                  <Stack>
                    {carePlans.map((cp: any) => (
                      <Card key={cp.id} withBorder p="sm" radius="md">
                        <Title order={5} c="grape">{cp.title || 'Protocolo Clínico'}</Title>
                        <Text size="sm" mt={4}>{cp.description}</Text>
                        <Badge color="green" mt={8}>Estado: {cp.status}</Badge>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="questionnaire">
              {!questionnaireSubmitted ? (
                <DynamicIntakeForm 
                  clinicType="advanced_clinic" 
                  medplum={medplum} 
                  onSuccess={() => setQuestionnaireSubmitted(true)} 
                />
              ) : (
                <Card bg="#e6fcf5" p="md" radius="md" withBorder>
                  <Text fw={600} c="teal" ta="center">¡Su información ha sido verificada y actualizada exitosamente en el sistema de la clínica!</Text>
                </Card>
              )}
            </Tabs.Panel>
          </Tabs>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}