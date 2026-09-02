"use client";

import { useState } from 'react';
import { 
  MantineProvider, AppShell, Group, Title, Text, Avatar, Card, ActionIcon, Stack, Button, Badge, ThemeIcon, Progress, Divider, Grid, Modal, Notification
} from '@mantine/core';
import { MasterSignature } from '@/components/shared/MasterSignature';

const tenantConfig = {
  brandColor: 'teal', 
  clinicName: 'Delchan Health',
  patientName: 'João da Silva',
  features: {
    telemedicine: true,
    healthSync: true, 
  }
};

const patientTheme = {
  primaryColor: tenantConfig.brandColor,
  defaultRadius: 'xl',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export default function PatientMobileApp() {
  const [activeTab, setActiveTab] = useState('home');
  
  // ESTADOS PARA RECIBIR EL "PUSH" DEL ADMIN
  const [pendingTCLE, setPendingTCLE] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSignDocument = () => {
    setShowSignaturePad(false);
    setPendingTCLE(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  return (
    <MantineProvider theme={patientTheme}>
      <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#f8fafc', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          
          <AppShell header={{ height: 70 }} footer={{ height: 80 }} padding="md">
            
            <AppShell.Header bg="white" style={{ borderBottom: 'none', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Group h="100%" px="md" justify="space-between">
                <Group gap="sm">
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
                
                <div>
                  <Text size="sm" c="dimmed" fw={600} tt="uppercase">Bem-vindo de volta,</Text>
                  <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
                    {tenantConfig.patientName.split(' ')[0]}
                  </Title>
                </div>

                {/* NOTIFICAÇÃO DE SUCESSO AO ASSINAR */}
                {showSuccess && (
                  <Notification title="Assinatura Salva!" color="teal" onClose={() => setShowSuccess(false)} radius="md">
                    Seu consentimento foi registrado com segurança e validade jurídica.
                  </Notification>
                )}

                {/* ALERTA DE TCLE */}
                {pendingTCLE ? (
                  <Card p="lg" radius="xl" bg="red.0" withBorder style={{ borderColor: 'transparent' }}>
                    <Group wrap="nowrap" align="flex-start">
                      <ThemeIcon size="xl" radius="xl" color="red.6">⚠️</ThemeIcon>
                      <div>
                        <Text fw={700} c="red.9">Assinatura Pendente</Text>
                        <Text size="sm" c="red.8" mt={4} lh={1.4}>
                          A recepção solicitou sua assinatura no Termo de Consentimento (LGPD) para o atendimento de hoje.
                        </Text>
                        <Button color="red.6" radius="xl" size="sm" mt="md" fullWidth onClick={() => setShowSignaturePad(true)}>
                          Assinar Agora no Celular
                        </Button>
                      </div>
                    </Group>
                  </Card>
                ) : (
                  <Card p="lg" radius="xl" bg="teal.0" withBorder style={{ borderColor: 'transparent' }}>
                    <Group wrap="nowrap">
                      <ThemeIcon size="lg" radius="xl" color="teal.6">✅</ThemeIcon>
                      <div>
                        <Text fw={700} c="teal.9">Documentação em Dia</Text>
                        <Text size="xs" c="teal.8">Todos os seus termos estão assinados.</Text>
                      </div>
                    </Group>
                  </Card>
                )}

                <Card p="lg" radius="xl" bg="white" shadow="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                  <Group justify="space-between" mb="sm">
                    <Badge color="blue" variant="light" size="sm" fw={700}>Consulta Confirmada</Badge>
                    <Text size="xs" c="dimmed" fw={600}>Hoje, 14:30</Text>
                  </Group>
                  <Title order={4} c="dark.9" fw={800}>Avaliação Clínica Geral</Title>
                  <Text size="sm" c="dimmed" mb="lg">👨‍⚕️ Dr. Alberto Silva • Unidade Jardins</Text>
                  
                  <Group grow>
                    <Button variant="outline" color="dark.8" radius="xl" onClick={() => alert('Solicitação de reagendamento enviada à clínica.')}>Reagendar</Button>
                    {tenantConfig.features.telemedicine && (
                      <Button color="teal" radius="xl" leftSection="🎥" onClick={() => alert('Iniciando sala virtual segura de Telemedicina...')}>Sala Virtual</Button>
                    )}
                  </Group>
                </Card>

                <Grid gutter="md">
                  {[
                    { icon: '📅', label: 'Agendar', action: () => alert('Abrindo catálogo de agendamentos...') },
                    { icon: '🧪', label: 'Exames', action: () => alert('Acessando laudos e exames laboratoriais...') },
                    { icon: '💊', label: 'Receitas', action: () => alert('Acessando receitas digitais com QR Code...') },
                    { icon: '💳', label: 'Pagamentos', action: () => alert('Histórico financeiro e Pix...') },
                  ].map((item, i) => (
                    <Grid.Col span={3} key={i}>
                      <Stack gap="xs" align="center" style={{ cursor: 'pointer' }} onClick={item.action}>
                        <ActionIcon size="xl" radius="xl" variant="light" color={tenantConfig.brandColor} style={{ width: '60px', height: '60px' }}>
                          <Text size="xl">{item.icon}</Text>
                        </ActionIcon>
                        <Text size="xs" fw={600} c="dark.8">{item.label}</Text>
                      </Stack>
                    </Grid.Col>
                  ))}
                </Grid>

              </Stack>
            </AppShell.Main>

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
                  <ActionIcon size={60} radius="xl" color={tenantConfig.brandColor} variant="filled" style={{ boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.4)' }}>
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

      {/* MODAL DE ASSINATURA TCLE */}
      <Modal opened={showSignaturePad} onClose={() => setShowSignaturePad(false)} withCloseButton={false} centered size="md" radius="md" padding={0}>
        <MasterSignature 
          documentName="Termo de Consentimento Livre e Esclarecido (TCLE) - LGPD" 
          brandColor={tenantConfig.brandColor} 
          onSign={handleSignDocument} 
          onCancel={() => setShowSignaturePad(false)} 
        />
      </Modal>

    </MantineProvider>
  );
}