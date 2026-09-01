"use client";

import { Card, Group, Avatar, Text, Badge, Button, Grid, RingProgress, Stack, ThemeIcon, ActionIcon, Box, UnstyledButton, FileButton, Loader, Indicator } from '@mantine/core';
import { IconDotsCircleHorizontal, IconTrendingUp, IconCalendarEvent, IconStethoscope, IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '../../contexts/TenantContext';
import { useSearchResources, useMedplum } from '@medplum/react-hooks';
import { Appointment, Encounter, Patient, Reference } from '@medplum/fhirtypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface DoctorProfileProps {
  practitioner?: any;
  onClose?: () => void;
}

export function DoctorProfile({ practitioner, onClose }: DoctorProfileProps) {
  const router = useRouter();
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [uploading, setUploading] = useState(false);

  const name = practitioner?.name?.[0] ? `${practitioner.name[0].given?.join(' ')} ${practitioner.name[0].family}` : 'Dr(a). Não Identificado';
  const role = practitioner?.telecom?.[0]?.value ? 'Especialista' : 'Dermatologista • CRM 148.392 - SP';
  const photoUrl = practitioner?.photo?.[0]?.url;

  const todayStr = new Date().toISOString().split('T')[0];
  
  const [appointments] = useSearchResources('Appointment', {
    actor: `Practitioner/${practitioner?.id}`,
    date: `ge${todayStr}`,
    _sort: 'date',
    _count: 5
  });

  const [encounters] = useSearchResources('Encounter', {
    participant: `Practitioner/${practitioner?.id}`,
    _sort: '-date',
    _count: 5,
    _include: 'Encounter:subject'
  });

  const recentPatients = (encounters || [])
    .map((enc: Encounter) => enc.subject as Reference<Patient>)
    .filter((v: Reference<Patient> | undefined, i: number, a: (Reference<Patient> | undefined)[]) => 
      v && a.findIndex((t: Reference<Patient> | undefined) => t?.reference === v?.reference) === i
    )
    .slice(0, 3);

  const navigateTo = (path: string) => {
    if (onClose) onClose();
    router.push(path);
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const binary = await medplum.createBinary(file, file.name, file.type);
      await medplum.updateResource({
        ...practitioner,
        photo: [{ url: binary.url, contentType: file.type }]
      });
      window.location.reload();
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Grid gutter="lg" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card radius="2xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: '100%' }}>
          
          <Group justify="space-between" align="flex-start" mb="xl">
            <FileButton onChange={handlePhotoUpload} accept="image/png,image/jpeg">
              {(props) => (
                <UnstyledButton {...props} style={{ position: 'relative' }}>
                  <Indicator inline size={24} offset={7} position="bottom-end" color={primaryColor} withBorder label="✎">
                    <Avatar src={photoUrl} color="dark.9" radius="xl" size={80} style={{ fontWeight: 800, fontSize: '24px', opacity: uploading ? 0.5 : 1 }}>
                      {!photoUrl && !uploading && name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      {uploading && <Loader size="sm" color="dark" />}
                    </Avatar>
                  </Indicator>
                </UnstyledButton>
              )}
            </FileButton>
            <ActionIcon variant="light" color="gray" radius="xl"><IconDotsCircleHorizontal size={20} /></ActionIcon>
          </Group>
          
          <Text fw={800} size="xl" c="dark.9">{name}</Text>
          <Text size="sm" c="dimmed" mb="md">{role}</Text>
          <Group gap="xs" mb="xl">
            <Badge color="teal" variant="light" size="sm" radius="sm">● Verificado</Badge>
            <Text size="xs" fw={700} c="orange.5">★ 4.9 (326)</Text>
          </Group>

          <Grid mb="xl">
            <Grid.Col span={6} style={{ borderRight: '1px solid #e2e8f0' }}>
              <Text size="xs" c="dimmed" fw={600}>Experiência</Text>
              <Text fw={800} size="lg" c="dark.9">12 anos</Text>
            </Grid.Col>
            <Grid.Col span={6} pl="md">
              <Text size="xs" c="dimmed" fw={600}>Pacientes</Text>
              <Text fw={800} size="lg" c="dark.9">1.850+</Text>
            </Grid.Col>
          </Grid>

          <Group grow>
            <Button color="dark.9" radius="xl" onClick={() => navigateTo('/doctor/agenda')}>Agendar consulta</Button>
            <Button variant="default" radius="xl">Mensagem</Button>
          </Group>

          <Box mt="xl" pt="md" style={{ borderTop: '1px solid #e2e8f0' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} size="sm">Pacientes Recentes</Text>
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/doctor/pacientes')}>Ver todos {'>'}</Text>
            </Group>
            <Stack gap="sm">
              {recentPatients.length > 0 ? recentPatients.map((ref, idx) => {
                const patientName = ref?.display || 'Paciente';
                const initials = patientName.substring(0, 2).toUpperCase();
                const colors = ['grape', 'blue', 'pink', 'orange', 'teal'];
                return (
                  <UnstyledButton key={idx} onClick={() => navigateTo(`/doctor/pacientes/${ref?.reference?.split('/')[1]}`)}>
                    <Group justify="space-between" style={{ padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }} bg="transparent" >
                      <Group gap="sm">
                        <Avatar color={colors[idx % colors.length]} radius="xl" size="md">{initials}</Avatar>
                        <div>
                          <Text size="sm" fw={600} c="dark.9">{patientName}</Text>
                          <Text size="xs" c="dimmed">🕒 Último atendimento</Text>
                        </div>
                      </Group>
                      <Text c="dimmed" size="xs">{'>'}</Text>
                    </Group>
                  </UnstyledButton>
                );
              }) : (
                <Text size="sm" c="dimmed" ta="center" py="md">Nenhum paciente recente</Text>
              )}
            </Stack>
          </Box>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" style={{ height: '100%' }}>
          <Group grow>
            <Card onClick={() => navigateTo('/doctor/dashboard')} radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <Group justify="space-between" mb="sm">
                <ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconStethoscope size={14}/></ThemeIcon>
                <Badge color="teal" variant="light" size="xs">+12%</Badge>
              </Group>
              <Text size="xs" c="dimmed" fw={700}>ATENDIMENTOS</Text>
              <Text fw={800} size="xl" c="dark.9">1.850</Text>
              <Text size="xs" c="dimmed">Últimos 90 dias</Text>
            </Card>
            <Card onClick={() => navigateTo('/doctor/dashboard')} radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <Group justify="space-between" mb="sm">
                <ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconTrendingUp size={14}/></ThemeIcon>
                <Badge color="dark" variant="filled" size="xs">Meta</Badge>
              </Group>
              <Text size="xs" c="dimmed" fw={700}>TAXA DE RETORNO</Text>
              <Text fw={800} size="xl" c="dark.9">87%</Text>
              <Text size="xs" c="dimmed">+4% vs mês anterior</Text>
            </Card>
          </Group>

          <Card onClick={() => navigateTo('/doctor/dashboard')} radius="2xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1, cursor: 'pointer' }}>
            <Group justify="space-between" mb="xl">
              <Text fw={700} size="sm">Satisfação (Avaliações)</Text>
              <Text size="xs" c="dimmed">Baseado em 326 avaliações</Text>
            </Group>
            
            <Group justify="center" mt="md" style={{ position: 'relative' }}>
              <RingProgress 
                size={200} 
                thickness={20} 
                roundCaps 
                sections={[{ value: 72, color: primaryColor }, { value: 20, color: 'blue.4' }, { value: 8, color: 'gray.3' }]} 
              />
              <div style={{ position: 'absolute', textAlign: 'center', top: '50%', transform: 'translateY(-50%)' }}>
                <Text fw={900} size="xl" style={{ fontSize: '32px' }} c="dark.9">4.9</Text>
                <Text size="xs" c="dimmed" fw={600}>DE 5.0</Text>
                <Text size="xs" c="orange.5" mt={4}>★★★★★</Text>
              </div>
            </Group>

            <Group justify="center" gap="lg" mt="xl">
              <Group gap="xs"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: primaryColor }} /><Text size="xs" fw={600} c="dimmed">Excelente 72%</Text></Group>
              <Group gap="xs"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#60a5fa' }} /><Text size="xs" fw={600} c="dimmed">Bom 20%</Text></Group>
              <Group gap="xs"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d1d5db' }} /><Text size="xs" fw={600} c="dimmed">Regular 8%</Text></Group>
            </Group>
          </Card>
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" style={{ height: '100%' }}>
          <Card p="lg" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700}><IconShieldCheck size={16} style={{ verticalAlign: 'middle' }}/> Convênios Ativos</Text>
              <Text size="xs" c="dimmed">2 vínculos</Text>
            </Group>
            <Stack gap="sm">
              <Group justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                <Group gap="sm">
                  <Avatar radius="xl" size="sm" color="gray" variant="light">UN</Avatar>
                  <div><Text size="xs" fw={700}>Unimed</Text><Text size="xs" c="dimmed">Nacional</Text></div>
                </Group>
                <Badge color="teal" variant="light" size="xs">Ativo</Badge>
              </Group>
              <Group justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                <Group gap="sm">
                  <Avatar radius="xl" size="sm" color="gray" variant="light">BR</Avatar>
                  <div><Text size="xs" fw={700}>Bradesco Saúde</Text><Text size="xs" c="dimmed">Top Nacional</Text></div>
                </Group>
                <Badge color="teal" variant="light" size="xs">Ativo</Badge>
              </Group>
            </Stack>
          </Card>

          <Card p="lg" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1 }}>
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700}><IconCalendarEvent size={16} style={{ verticalAlign: 'middle' }}/> Próximos Agendamentos</Text>
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/doctor/agenda')}>Ver toda a agenda {'>'}</Text>
            </Group>
            <Stack gap="sm">
              {appointments && appointments.length > 0 ? appointments.map((apt: Appointment, idx) => {
                 const startTime = apt.start ? format(new Date(apt.start), 'HH:mm') : '--:--';
                 const isToday = apt.start && new Date(apt.start).toDateString() === new Date().toDateString();
                 
                 const patientParticipant = apt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
                 const patientName = patientParticipant?.actor?.display || 'Paciente';
                 const initials = patientName.substring(0, 2).toUpperCase();
                 
                 return (
                  <UnstyledButton key={apt.id || idx} onClick={() => navigateTo(`/doctor/agenda?id=${apt.id}`)}>
                    <Group justify="space-between" wrap="nowrap" style={{ padding: '8px', borderRadius: '8px' }} bg="transparent">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="blue" radius="xl" size="md" variant="light">{initials}</Avatar>
                        <div>
                          <Text size="sm" fw={700} truncate>{patientName}</Text>
                          <Text size="xs" c="dimmed" truncate>{apt.serviceType?.[0]?.text || 'Consulta'}</Text>
                        </div>
                      </Group>
                      <Badge color={isToday ? primaryColor : 'dark'} variant="filled">{isToday ? `Hoje • ${startTime}` : startTime}</Badge>
                    </Group>
                  </UnstyledButton>
                 );
              }) : (
                <Text size="sm" c="dimmed" ta="center" py="md">Nenhum agendamento futuro</Text>
              )}
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}