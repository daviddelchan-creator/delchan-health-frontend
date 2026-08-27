"use client";

import { useState } from 'react';
import { 
  MantineProvider, AppShell, Group, Title, Text, Avatar, Card, ActionIcon, Stack, Button, Badge, ThemeIcon, Progress, Divider, Grid 
} from '@mantine/core';

// 1. SIMULACIÓN DE BRANDING DINÁMICO (Viene del Admin)
const tenantConfig = {
  brandColor: 'violet', // El Admin puede cambiar esto a 'blue', 'teal', 'rose', etc.
  clinicName: 'Delchan Health',
  patientName: 'João da Silva',
  features: {
    telemedicine: true,
    healthSync: true, // Integración con Apple/Google Health
  }
};

const patientTheme = {
  primaryColor: tenantConfig.brandColor,
  defaultRadius: 'xl',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export default function PatientMobileApp() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <MantineProvider theme={patientTheme}>
      {/* Contenedor centralizado para simular la vista móvil en pantallas grandes */}
      <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#f8fafc', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          
          <AppShell
            header={{ height: 70 }}
            footer={{ height: 80 }}
            padding="md"
          >
            {/* HEADER MÓVIL (Branding y Perfil) */}
            <AppShell.Header bg="white" style={{ borderBottom: 'none', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Group h="100%" px="md" justify="space-between">
                <Group gap="sm">
                  {/* Simulación del Logo Delchan Health OS (ADN/Escudo) */}
                  <ThemeIcon size="lg" radius="md" color={tenantConfig.brandColor} variant="light">
                    <Text fw={800} size="lg">🧬</Text>
                  </ThemeIcon>
                  <Title order={4} c="dark.9" fw={800}>{tenantConfig.clinicName}</Title>
                </Group>
                <Avatar color={tenantConfig.brandColor} radius="xl">{tenantConfig.patientName.charAt(0)}</Avatar>
              </Group>
            </AppShell.Header>

            <AppShell.Main pt={90} pb={100}>
              <Stack gap="lg">
                
                {/* SALUDO Y CALL TO ACTION PRINCIPAL */}
                <div>
                  <Text size="sm" c="dimmed" fw={600} tt="uppercase">Bem-vindo de volta,</Text>
                  <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
                    {tenantConfig.patientName.split(' ')[0]}
                  </Title>
                </div>

                {/* ALERTA DE ACCIÓN: LLENAR ANAMNESIS DIGITAL */}
                <Card p="lg" radius="xl" bg={`${tenantConfig.brandColor}.0`} withBorder style={{ borderColor: 'transparent' }}>
                  <Group wrap="nowrap" align="flex-start">
                    <ThemeIcon size="xl" radius="xl" color={tenantConfig.brandColor}>📋</ThemeIcon>
                    <div>
                      <Text fw={700} c={`${tenantConfig.brandColor}.9`}>Ação Necessária</Text>
                      <Text size="sm" c={`${tenantConfig.brandColor}.8`} mt={4} lh={1.4}>
                        Sua consulta com o Dr. Alberto é amanhã. Preencha sua ficha de anamnese agora para agilizar seu atendimento.
                      </Text>
                      <Button color={tenantConfig.brandColor} radius="xl" size="sm" mt="md" fullWidth>
                        Preencher Ficha Digital
                      </Button>
                    </div>
                  </Group>
                </Card>

                {/* PRÓXIMA CITA (Con validación de Check-in) */}
                <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                  <Group justify="space-between" mb="sm">
                    <Badge color="blue" variant="light" size="sm" fw={700}>Consulta Confirmada</Badge>
                    <Text size="xs" c="dimmed" fw={600}>Amanhã, 09:00 AM</Text>
                  </Group>
                  <Title order={4} c="dark.9" fw={800}>Cardiologia Preventiva</Title>
                  <Text size="sm" c="dimmed" mb="lg">👨‍⚕️ Dr. Alberto Silva • Unidade Central</Text>
                  
                  <Group grow>
                    <Button variant="outline" color="dark.8" radius="xl">Reagendar</Button>
                    {tenantConfig.features.telemedicine && (
                      <Button color="blue" radius="xl" leftSection="🎥">Sala Virtual</Button>
                    )}
                  </Group>
                </Card>

                {/* BOTONES RÁPIDOS (Grid Móvil) */}
                <Grid gutter="md">
                  {[
                    { icon: '📅', label: 'Agendar' },
                    { icon: '🧪', label: 'Exames' },
                    { icon: '💊', label: 'Receitas' },
                    { icon: '💳', label: 'Pagamentos' },
                  ].map((item, i) => (
                    <Grid.Col span={3} key={i}>
                      <Stack gap="xs" align="center">
                        <ActionIcon size="xl" radius="xl" variant="light" color={tenantConfig.brandColor} style={{ width: '60px', height: '60px' }}>
                          <Text size="xl">{item.icon}</Text>
                        </ActionIcon>
                        <Text size="xs" fw={600} c="dark.8">{item.label}</Text>
                      </Stack>
                    </Grid.Col>
                  ))}
                </Grid>

                {/* INTEGRACIÓN CON WEARABLES (Apple Health / Google Fit) */}
                {tenantConfig.features.healthSync && (
                  <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                    <Group justify="space-between" mb="md">
                      <Title order={5} c="dark.9" fw={800}>Sincronização de Saúde</Title>
                      <Badge color="green" variant="light" leftSection="⌚">Conectado</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mb="md">Dados coletados automaticamente do seu Apple Health / Samsung Health.</Text>
                    
                    <Stack gap="md">
                      <div>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm" fw={700} c="dark.8">Passos Diários</Text>
                          <Text size="sm" fw={800} c={tenantConfig.brandColor}>6.430 <Text span size="xs" c="dimmed" fw={500}>/ 10k</Text></Text>
                        </Group>
                        <Progress value={64} color={tenantConfig.brandColor} radius="xl" size="md" />
                      </div>
                      
                      <Divider color="#f1f5f9" />

                      <Group justify="space-between">
                        <Group gap="sm">
                          <ThemeIcon color="red" variant="light" radius="md">❤️</ThemeIcon>
                          <div>
                            <Text size="sm" fw={700} c="dark.8">Frequência Cardíaca</Text>
                            <Text size="xs" c="dimmed">Média em repouso</Text>
                          </div>
                        </Group>
                        <Title order={3} c="dark.9">72 <Text span size="xs" fw={500} c="dimmed">bpm</Text></Title>
                      </Group>
                    </Stack>
                  </Card>
                )}

              </Stack>
            </AppShell.Main>

            {/* BOTTOM NAVIGATION BAR (Estilo App Nativa) */}
            <AppShell.Footer bg="white" style={{ borderTop: '1px solid #f1f5f9', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '10px 20px' }} zIndex={100}>
              <Group justify="space-between" align="center" h="100%">
                <Stack gap={4} align="center" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer', width: '60px' }}>
                  <Text size="xl" c={activeTab === 'home' ? tenantConfig.brandColor : 'gray.4'}>🏠</Text>
                  <Text size="xs" fw={700} c={activeTab === 'home' ? tenantConfig.brandColor : 'gray.5'}>Início</Text>
                </Stack>
                
                <Stack gap={4} align="center" onClick={() => setActiveTab('calendar')} style={{ cursor: 'pointer', width: '60px' }}>
                  <Text size="xl" c={activeTab === 'calendar' ? tenantConfig.brandColor : 'gray.4'}>🗓️</Text>
                  <Text size="xs" fw={700} c={activeTab === 'calendar' ? tenantConfig.brandColor : 'gray.5'}>Agenda</Text>
                </Stack>

                <Stack gap={4} align="center" onClick={() => setActiveTab('ai')} style={{ cursor: 'pointer', width: '60px', position: 'relative', top: '-15px' }}>
                  <ActionIcon size={60} radius="xl" color={tenantConfig.brandColor} variant="filled" style={{ boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.4)' }}>
                    <Text size="xl">✨</Text>
                  </ActionIcon>
                  <Text size="xs" fw={700} c={tenantConfig.brandColor}>IA Assist</Text>
                </Stack>

                <Stack gap={4} align="center" onClick={() => setActiveTab('records')} style={{ cursor: 'pointer', width: '60px' }}>
                  <Text size="xl" c={activeTab === 'records' ? tenantConfig.brandColor : 'gray.4'}>📂</Text>
                  <Text size="xs" fw={700} c={activeTab === 'records' ? tenantConfig.brandColor : 'gray.5'}>Fichas</Text>
                </Stack>

                <Stack gap={4} align="center" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer', width: '60px' }}>
                  <Text size="xl" c={activeTab === 'profile' ? tenantConfig.brandColor : 'gray.4'}>👤</Text>
                  <Text size="xs" fw={700} c={activeTab === 'profile' ? tenantConfig.brandColor : 'gray.5'}>Perfil</Text>
                </Stack>
              </Group>
            </AppShell.Footer>

          </AppShell>
        </div>
      </div>
    </MantineProvider>
  );
}