"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Title, Text, Card, Grid, Group, Badge, ThemeIcon, Box, Button, Avatar, Stack, Drawer, Table, ActionIcon, Loader, Center
} from '@mantine/core';
import { 
  IconCurrencyDollar, IconClipboardList, IconTrendingUp, IconUserPlus, IconCalendarPlus, IconStethoscope, IconMessageDots, IconBrandWhatsapp, IconArrowRight
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Patient, Appointment, Task, Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '../../../contexts/TenantContext';
import { PatientWorkspace } from '../../../components/PatientWorkspace';

export default function DoctorDashboard() {
  const router = useRouter();
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;
  const { tenantConfig, dict } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const doctorName = profile?.name?.[0]?.given?.[0] || 'Doutor(a)';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsBundle, apptsBundle, tasksBundle] = await Promise.all([
        medplum.searchResources('Patient', { _sort: '-_lastUpdated', _count: 6 }),
        medplum.searchResources('Appointment', { _sort: '-date', _count: 5 }),
        medplum.searchResources('Task', { _sort: '-authoredOn', _count: 4 })
      ]);
      setPatients(patientsBundle);
      setAppointments(apptsBundle);
      setLeads(tasksBundle);
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [medplum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px' }}>
      
      {/* CABEÇALHO DO DASHBOARD */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} fw={800} c="dark.9" style={{ letterSpacing: '-0.5px' }}>
            Olá, Dr(a). {doctorName} 👋
          </Title>
          <Text c="dimmed" size="sm" mt={2}>
            Painel Executivo • Visão geral do dia na clínica <b>{tenantConfig.name}</b>.
          </Text>
        </div>
        <Group>
          <Button 
            color={primaryColor} 
            radius="xl" 
            size="md" 
            leftSection={<IconUserPlus size={18} />} 
            onClick={() => router.push('/doctor/pacientes/novo')}
          >
            + Novo {dict.patient}
          </Button>
          <Button 
            variant="default" 
            radius="xl" 
            size="md" 
            leftSection={<IconCalendarPlus size={18} />} 
            onClick={() => router.push('/doctor/agenda')}
          >
            Agendar Consulta
          </Button>
        </Group>
      </Group>

      {/* CARDS DE INDICADORES / KPIS */}
      <Grid gutter="md" mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Receita Mensal</Text>
              <ThemeIcon color="teal" variant="light" radius="xl" size="md">
                <IconCurrencyDollar size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">R$ 18.450,00</Title>
            <Badge color="teal" variant="light" size="xs" mt="xs">+14% vs mês anterior</Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Consultas Realizadas</Text>
              <ThemeIcon color="blue" variant="light" radius="xl" size="md">
                <IconClipboardList size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">{appointments.length > 0 ? appointments.length + 18 : 24}</Title>
            <Text size="xs" c="dimmed" mt="xs">8 consultas hoje</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Oportunidades no CRM</Text>
              <ThemeIcon color="orange" variant="light" radius="xl" size="md">
                <IconMessageDots size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">{leads.length > 0 ? leads.length + 5 : 7}</Title>
            <Badge color="orange" variant="light" size="xs" mt="xs">4 aguardando contato</Badge>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card p="lg" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="xs">
              <Text fw={700} c="dimmed" size="xs" tt="uppercase">Taxa de Retorno</Text>
              <ThemeIcon color="grape" variant="light" radius="xl" size="md">
                <IconTrendingUp size={18} />
              </ThemeIcon>
            </Group>
            <Title order={2} fw={900} c="dark.9">89%</Title>
            <Badge color="teal" variant="light" size="xs" mt="xs">Meta da Clínica: 80%</Badge>
          </Card>
        </Grid.Col>
      </Grid>

      {/* SEÇÕES PRINCIPAIS: PACIENTES DO DIA & CRM */}
      <Grid gutter="xl">
        {/* COLUNA ESQUERDA: PACIENTES RECENTES E PRONTUÁRIOS */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={4} c="dark.9">Últimos {dict.patient}s Atendidos</Title>
                <Text size="xs" c="dimmed">Acesse o prontuário em um clique para registrar evolução ou receituário.</Text>
              </div>
              <Button 
                variant="subtle" 
                color={primaryColor} 
                size="xs" 
                rightSection={<IconArrowRight size={14} />} 
                onClick={() => router.push('/doctor/pacientes')}
              >
                Ver Todos ({patients.length})
              </Button>
            </Group>

            {loading ? (
              <Center py="xl"><Loader color={primaryColor} /></Center>
            ) : patients.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum paciente cadastrado recentemente.</Text>
            ) : (
              <Stack gap="sm">
                {patients.slice(0, 5).map((p) => {
                  const name = p.name?.[0] ? `${p.name[0].given?.join(' ')} ${p.name[0].family || ''}` : `${dict.patient} Sem Nome`;
                  const phone = p.telecom?.find(t => t.system === 'phone')?.value || 'Sem telefone';
                  return (
                    <Card key={p.id} p="sm" radius="lg" withBorder bg="#fcfcfd" style={{ borderColor: '#f1f5f9' }}>
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Avatar color={primaryColor} radius="xl">{name.charAt(0).toUpperCase()}</Avatar>
                          <div>
                            <Text fw={700} size="sm" c="dark.9">{name}</Text>
                            <Text size="xs" c="dimmed">{phone} • ID: #{p.id?.slice(0, 6)}</Text>
                          </div>
                        </Group>
                        <Group gap="xs">
                          <Button 
                            size="xs" 
                            color={primaryColor} 
                            variant="light" 
                            radius="xl" 
                            leftSection={<IconStethoscope size={14} />} 
                            onClick={() => setSelectedPatient(p)}
                          >
                            Abrir Prontuário
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* COLUNA DIREITA: LEADS DO CRM E ATALHOS */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="md" style={{ height: '100%' }}>
            {/* CARD LEADS */}
            <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0', flex: 1 }}>
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={4} c="dark.9">Leads & Novas Oportunidades</Title>
                  <Text size="xs" c="dimmed">Pacientes em potencial aguardando retorno.</Text>
                </div>
                <Button variant="subtle" color="blue" size="xs" onClick={() => router.push('/doctor/crm')}>
                  Abrir CRM
                </Button>
              </Group>

              <Stack gap="sm">
                {[
                  { name: 'Juliana Costa', msg: 'Consulta Dermatologia', source: 'whatsapp', time: '10 min' },
                  { name: 'Carlos Mendes', msg: 'Orçamento Botox', source: 'instagram', time: '1 hora' },
                  { name: 'Ana Souza', msg: 'Retorno Clínico', source: 'form', time: 'Ontem' },
                ].map((lead, idx) => (
                  <Card key={idx} p="sm" radius="md" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
                    <Group justify="space-between">
                      <div>
                        <Text fw={700} size="sm" c="dark.9">{lead.name}</Text>
                        <Text size="xs" c="teal.8" fw={600}>{lead.msg}</Text>
                      </div>
                      <Button 
                        size="xs" 
                        color="teal" 
                        variant="light" 
                        radius="xl" 
                        leftSection={<IconBrandWhatsapp size={14} />}
                        onClick={() => router.push('/doctor/crm')}
                      >
                        Responder
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Card>

            {/* CARD ATALHOS RÁPIDOS */}
            <Card p="lg" radius="xl" withBorder bg="#f8fafc" style={{ borderColor: '#e2e8f0' }}>
              <Text fw={700} size="xs" c="dimmed" tt="uppercase" mb="sm">Módulos Rápidos</Text>
              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <Button fullWidth variant="default" radius="xl" size="xs" onClick={() => router.push('/doctor/agenda')}>
                    📅 Ver Agenda Completa
                  </Button>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Button fullWidth variant="default" radius="xl" size="xs" onClick={() => router.push('/doctor/configuracao')}>
                    🔐 Meu Cofre e-CPF
                  </Button>
                </Grid.Col>
              </Grid>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* DRAWER DO PRONTUÁRIO INTEGRADO */}
      <Drawer 
        opened={!!selectedPatient} 
        onClose={() => setSelectedPatient(null)} 
        position="right" 
        size="100%" 
        padding={0} 
        withCloseButton={false}
      >
        {selectedPatient && (
          <PatientWorkspace 
            patient={selectedPatient} 
            medplum={medplum} 
            doctorName={doctorName} 
            onClose={() => setSelectedPatient(null)} 
          />
        )}
      </Drawer>

    </div>
  );
}