"use client";

import { Card, Group, Avatar, Text, Badge, Button, Grid, RingProgress, Stack, ThemeIcon, ActionIcon, Box, UnstyledButton, FileButton, Loader, Indicator } from '@mantine/core';
import { IconDotsCircleHorizontal, IconTrendingUp, IconCalendarEvent, IconStethoscope, IconShieldCheck, IconBrandWhatsapp, IconBrandInstagram } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '../../contexts/TenantContext';
import { useSearchResources, useMedplum } from '@medplum/react-hooks';
import { Appointment, Encounter, Patient, Reference, Task } from '@medplum/fhirtypes';
import { format } from 'date-fns';
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
  const role = practitioner?.telecom?.[0]?.value ? 'Especialista' : 'Médico Especialista';
  const photoUrl = practitioner?.photo?.[0]?.url;

  const todayStr = new Date().toISOString().split('T')[0];
  
  const [appointments] = useSearchResources('Appointment', { actor: `Practitioner/${practitioner?.id}`, date: `ge${todayStr}`, _sort: 'date', _count: 5 });
  const [encounters] = useSearchResources('Encounter', { participant: `Practitioner/${practitioner?.id}`, _sort: '-date', _count: 5, _include: 'Encounter:subject' });
  
  // Buscar Leads (Tasks) do CRM atribuídos a este médico
  const [crmTasks] = useSearchResources('Task', practitioner?.id ? { owner: `Practitioner/${practitioner.id}`, _sort: '-_lastUpdated', _count: 4 } : { _sort: '-_lastUpdated', _count: 4 });

  const recentPatients = (encounters || [])
    .map((enc: Encounter) => enc.subject as Reference<Patient>)
    .filter((v: Reference<Patient> | undefined, i: number, a: (Reference<Patient> | undefined)[]) => v && a.findIndex((t: Reference<Patient> | undefined) => t?.reference === v?.reference) === i)
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
      await medplum.updateResource({ ...practitioner, photo: [{ url: binary.url, contentType: file.type }] });
      window.location.reload();
    } catch (err) {} finally { setUploading(false); }
  };

  return (
    <Grid gutter="lg" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      
      {/* COLUMNA 1: PERFIL */}
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
          <Group gap="xs" mb="xl"><Badge color="teal" variant="light" size="sm" radius="sm">● Verificado</Badge><Text size="xs" fw={700} c="orange.5">★ 4.9 (326)</Text></Group>

          <Grid mb="xl">
            <Grid.Col span={6} style={{ borderRight: '1px solid #e2e8f0' }}><Text size="xs" c="dimmed" fw={600}>Experiência</Text><Text fw={800} size="lg" c="dark.9">12 anos</Text></Grid.Col>
            <Grid.Col span={6} pl="md"><Text size="xs" c="dimmed" fw={600}>Pacientes</Text><Text fw={800} size="lg" c="dark.9">1.850+</Text></Grid.Col>
          </Grid>
          <Group grow><Button color="dark.9" radius="xl" onClick={() => navigateTo('/doctor/agenda')}>Agendar consulta</Button><Button variant="default" radius="xl">Mensagem</Button></Group>
        </Card>
      </Grid.Col>

      {/* COLUMNA 2: MÉTRICAS Y CRM */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" style={{ height: '100%' }}>
          <Group grow>
            <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="sm"><ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconStethoscope size={14}/></ThemeIcon><Badge color="teal" variant="light" size="xs">+12%</Badge></Group>
              <Text size="xs" c="dimmed" fw={700}>ATENDIMENTOS</Text><Text fw={800} size="xl" c="dark.9">1.850</Text>
            </Card>
            <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="sm"><ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconTrendingUp size={14}/></ThemeIcon><Badge color="dark" variant="filled" size="xs">Meta</Badge></Group>
              <Text size="xs" c="dimmed" fw={700}>TAXA DE RETORNO</Text><Text fw={800} size="xl" c="dark.9">87%</Text>
            </Card>
          </Group>

          {/* NUEVA SECCIÓN: FUNÇÕES DO CRM */}
          <Card radius="2xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1 }}>
            <Group justify="space-between" mb="lg">
              <Text fw={800} size="md">Funções do CRM (Leads)</Text>
              <Badge color="blue" variant="light">Atribuídos a você</Badge>
            </Group>
            
            <Stack gap="sm">
              {crmTasks && crmTasks.length > 0 ? crmTasks.map((task: Task, idx) => {
                const isWpp = task.businessStatus?.text?.toLowerCase() === 'whatsapp';
                const SourceIcon = isWpp ? IconBrandWhatsapp : IconBrandInstagram;
                const leadName = task.for?.display || 'Novo Paciente';
                
                return (
                  <Group key={task.id || idx} justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }} wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar radius="xl" size="sm" color="gray" variant="light">{leadName.charAt(0)}</Avatar>
                      <div>
                        <Text size="xs" fw={700} truncate w={100}>{leadName}</Text>
                        <Text size="xs" c="dimmed">Task CRM</Text>
                      </div>
                    </Group>
                    <Badge color={task.status === 'in-progress' ? 'orange' : 'teal'} variant="light" size="xs">
                      {task.status === 'in-progress' ? 'Em Contato' : 'Novo Lead'}
                    </Badge>
                    <Group gap="xs">
                      <SourceIcon size={16} color={isWpp ? '#25D366' : '#E1306C'} />
                    </Group>
                    <Button size="xs" variant="default" radius="xl" onClick={() => navigateTo('/doctor/crm')}>Mover</Button>
                  </Group>
                );
              }) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">Você não possui novos leads atribuídos no momento.</Text>
              )}
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>

      {/* COLUMNA 3: AGENDA Y CONVENIOS */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" style={{ height: '100%' }}>
          <Card p="lg" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="space-between" mb="md"><Text size="sm" fw={700}><IconShieldCheck size={16} style={{ verticalAlign: 'middle' }}/> Convênios Ativos</Text><Text size="xs" c="dimmed">2 vínculos</Text></Group>
            <Stack gap="sm">
              <Group justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}><Group gap="sm"><Avatar radius="xl" size="sm" color="gray" variant="light">UN</Avatar><div><Text size="xs" fw={700}>Unimed</Text></div></Group><Badge color="teal" variant="light" size="xs">Ativo</Badge></Group>
              <Group justify="space-between" p="sm" style={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}><Group gap="sm"><Avatar radius="xl" size="sm" color="gray" variant="light">BR</Avatar><div><Text size="xs" fw={700}>Bradesco Saúde</Text></div></Group><Badge color="teal" variant="light" size="xs">Ativo</Badge></Group>
            </Stack>
          </Card>

          <Card p="lg" radius="2xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1 }}>
            <Group justify="space-between" mb="md"><Text size="sm" fw={700}><IconCalendarEvent size={16} style={{ verticalAlign: 'middle' }}/> Próximos Agendamentos</Text><Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/doctor/agenda')}>Ver agenda {'>'}</Text></Group>
            <Stack gap="sm">
              {appointments && appointments.length > 0 ? appointments.map((apt: Appointment, idx) => {
                 const startTime = apt.start ? format(new Date(apt.start), 'HH:mm') : '--:--';
                 const isToday = apt.start && new Date(apt.start).toDateString() === new Date().toDateString();
                 const patientParticipant = apt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
                 const patientName = patientParticipant?.actor?.display || 'Paciente';
                 
                 return (
                  <UnstyledButton key={apt.id || idx} onClick={() => navigateTo(`/doctor/agenda?id=${apt.id}`)}>
                    <Group justify="space-between" wrap="nowrap" style={{ padding: '8px', borderRadius: '8px' }} bg="transparent">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="blue" radius="xl" size="md" variant="light">{patientName.substring(0, 2).toUpperCase()}</Avatar>
                        <div><Text size="sm" fw={700} truncate>{patientName}</Text></div>
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