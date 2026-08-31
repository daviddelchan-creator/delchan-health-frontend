"use client";

import { Card, Group, Avatar, Text, Badge, Button, Grid, RingProgress, Stack, ThemeIcon, ActionIcon, Box } from '@mantine/core';
import { IconDotsCircleHorizontal, IconVideo, IconTrendingUp, IconCalendarEvent, IconStethoscope, IconShieldCheck } from '@tabler/icons-react';
import { useTenant } from '../../contexts/TenantContext';

export function DoctorProfile({ practitioner }: { practitioner?: any }) {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const name = practitioner?.name?.[0] ? `${practitioner.name[0].given?.join(' ')} ${practitioner.name[0].family}` : 'Dr. Rafael Monteiro';
  const role = practitioner?.telecom?.[0]?.value ? 'Especialista' : 'Dermatologista • CRM 148.392 - SP';

  return (
    <Grid gutter="lg" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card radius="2xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: '100%' }}>
          <Group justify="space-between" align="flex-start" mb="xl">
            <Avatar color="dark.9" radius="xl" size={80} style={{ fontWeight: 800, fontSize: '24px' }}>
              {name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </Avatar>
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
            <Button color="dark.9" radius="xl">Agendar consulta</Button>
            <Button variant="default" radius="xl">Mensagem</Button>
          </Group>

          <Box mt="xl" pt="md" style={{ borderTop: '1px solid #e2e8f0' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} size="sm">Pacientes Recentes</Text>
              <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }}>Ver todos {'>'}</Text>
            </Group>
            <Stack gap="sm">
              {['Ana Beatriz L.', 'Carlos Eduardo M.', 'Juliana Rios'].map((paciente, idx) => (
                <Group key={idx} justify="space-between">
                  <Group gap="sm">
                    <Avatar color={['grape', 'blue', 'pink'][idx]} radius="xl" size="md">{paciente.split(' ')[0][0]}{paciente.split(' ')[1][0]}</Avatar>
                    <div>
                      <Text size="sm" fw={600}>{paciente}</Text>
                      <Text size="xs" c="dimmed">🕒 há 2d</Text>
                    </div>
                  </Group>
                  <Text c="dimmed" size="xs">{'>'}</Text>
                </Group>
              ))}
            </Stack>
          </Box>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" style={{ height: '100%' }}>
          <Group grow>
            <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="sm">
                <ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconStethoscope size={14}/></ThemeIcon>
                <Badge color="teal" variant="light" size="xs">+12%</Badge>
              </Group>
              <Text size="xs" c="dimmed" fw={700}>ATENDIMENTOS</Text>
              <Text fw={800} size="xl" c="dark.9">1.850</Text>
              <Text size="xs" c="dimmed">Últimos 90 dias</Text>
            </Card>
            <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="sm">
                <ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconTrendingUp size={14}/></ThemeIcon>
                <Badge color="dark" variant="filled" size="xs">Meta</Badge>
              </Group>
              <Text size="xs" c="dimmed" fw={700}>TAXA DE RETORNO</Text>
              <Text fw={800} size="xl" c="dark.9">87%</Text>
              <Text size="xs" c="dimmed">+4% vs mês anterior</Text>
            </Card>
          </Group>

          <Card radius="2xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', flex: 1 }}>
            <Group justify="space-between" mb="xl">
              <Text fw={700} size="sm">Satisfação</Text>
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
              <Text size="xs" c="dimmed">3 vínculos</Text>
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
              <Badge color={primaryColor} size="sm">Hoje • 4</Badge>
            </Group>
            <Stack gap="sm">
              {[
                { name: 'Mariana Lopes', type: 'Retorno • Presencial', time: '09:30', color: 'teal' },
                { name: 'Fernanda Costa', type: 'Primeira consulta • Presencial', time: '10:15', color: 'blue' },
                { name: 'Patrícia Lima', type: 'Procedimento • Presencial', time: '11:00', color: 'pink' }
              ].map((apt, idx) => (
                <Group key={idx} justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Avatar color={apt.color} radius="xl" size="md" variant="light">{apt.name.split(' ')[0][0]}{apt.name.split(' ')[1][0]}</Avatar>
                    <div>
                      <Text size="sm" fw={700} truncate>{apt.name}</Text>
                      <Text size="xs" c="dimmed" truncate>{apt.type}</Text>
                    </div>
                  </Group>
                  <Badge color="dark" variant="filled">{apt.time}</Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}