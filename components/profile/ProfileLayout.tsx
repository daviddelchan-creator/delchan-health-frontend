'use client';

import { Grid, Card, Group, Tabs, Button, Avatar, Text, Title, Badge, RingProgress, Table, ActionIcon, Stack } from '@mantine/core';
import { useTenant } from '../../contexts/TenantContext';


export function ProfileLayout({ type, data }: { type: 'practitioner' | 'patient', data: any }) {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig.internalColor || '#0d9488';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* HEADER SUPERIOR */}
        <Card radius="20px" padding="lg" mb="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
          <Group justify="space-between">
            <Group gap="md">
              <Avatar size={44} radius="xl" color="teal" styles={{ root: { backgroundColor: primaryColor, color: '#fff', fontWeight: 800 } }}>
                DE
              </Avatar>
              <div>
                <Title order={4} fw={800}>Delchan <Text span c="dimmed" fw={400} size="sm">OS</Text></Title>
              </div>
              <Group ml="xl" gap="xs">
                <Button variant="subtle" color="gray" radius="xl">Início</Button>
                <Button variant="filled" color="dark" radius="xl" style={{ backgroundColor: '#111827' }}>Pacientes</Button>
                <Button variant="subtle" color="gray" radius="xl">Agenda</Button>
                <Button variant="subtle" color="gray" radius="xl">Financeiro</Button>
              </Group>
            </Group>
            <Button radius="xl" size="md" leftSection="+" style={{ backgroundColor: primaryColor }}>
              Novo Registro
            </Button>
          </Group>
        </Card>

        {/* NAVEGACIÓN DE PESTAÑAS (Visão Geral, Prontuário, etc.) */}
        <Tabs defaultValue="visao-geral" color="teal" mb="xl">
          <Tabs.List>
            <Tabs.Tab value="visao-geral" fw={600}>Visão Geral</Tabs.Tab>
            <Tabs.Tab value="prontuario" fw={600}>Prontuário</Tabs.Tab>
            <Tabs.Tab value="evolucao" fw={600}>Evolução</Tabs.Tab>
            <Tabs.Tab value="financeiro" fw={600}>Financeiro</Tabs.Tab>
            <Tabs.Tab value="documentos" fw={600}>Documentos</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* GRID DE 3 COLUMNAS EXACTO A LA TABLET */}
        <Grid gutter="md">
          
          {/* COLUMNA IZQUIERDA (3 Cols): Perfil, Stats y Relacionados */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card radius="20px" padding="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group align="flex-start" mb="md">
                <Avatar size={72} radius="xl" src={data?.photo} name={data?.name} color="teal">
                  {data?.initials || 'RM'}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Title order={5} fw={700}>{data?.name || 'Dr. Rafael Monteiro'}</Title>
                  <Text size="xs" c="dimmed" mt={2}>{data?.specialty || 'Dermatologista'} • {data?.crm || 'CRM 148.392 - SP'}</Text>
                  <Group gap={6} mt={6}>
                    <Badge color="emerald" variant="light" size="sm">Verificado</Badge>
                    <Text size="xs" fw={700} c="amber.7">⭐ 4.9 (326)</Text>
                  </Group>
                </div>
              </Group>

              <Grid gutter="xs" mb="lg">
                <Grid.Col span={6}>
                  <Card p="sm" radius="lg" bg="#fcfcfc" withBorder style={{ borderColor: '#f1f5f9' }}>
                    <Text size="xs" c="dimmed">Experiência</Text>
                    <Text size="sm" fw={700}>12 anos</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card p="sm" radius="lg" bg="#fcfcfc" withBorder style={{ borderColor: '#f1f5f9' }}>
                    <Text size="xs" c="dimmed">Pacientes</Text>
                    <Text size="sm" fw={700}>1.850+</Text>
                  </Card>
                </Grid.Col>
              </Grid>

              <Button fullWidth radius="xl" mb="sm" style={{ backgroundColor: primaryColor }}>Agendar consulta</Button>
              <Button fullWidth variant="default" radius="xl">Mensagem</Button>
            </Card>

            {/* Lista de Recientes */}
            <Card radius="20px" padding="lg" mt="md" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="sm">
                <Text fw={700} size="sm">Pacientes Recentes</Text>
                <Text size="xs" c="blue" style={{ cursor: 'pointer' }}>Ver todos &gt;</Text>
              </Group>
              <Stack gap="sm">
                {['Ana Beatriz L.', 'Carlos Eduardo M.', 'Juliana Rios'].map((patient, idx) => (
                  <Group justify="space-between" key={idx} p={6} style={{ borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                    <Group gap="xs">
                      <Avatar size={32} radius="xl" color="teal">{patient.charAt(0)}</Avatar>
                      <div>
                        <Text size="xs" fw={600}>{patient}</Text>
                        <Text size="9px" c="dimmed">32a • há 2d</Text>
                      </div>
                    </Group>
                    <ActionIcon size="sm" variant="subtle" color="gray">&gt;</ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>

          {/* COLUMNA CENTRAL (5 Cols): KPIs, Satisfacción y Gráficos */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Grid gutter="sm" mb="md">
              <Grid.Col span={6}>
                <Card radius="20px" padding="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Group justify="space-between" mb="xs">
                    <Text size="xs" c="dimmed" fw={600}>ATENDIMENTOS</Text>
                    <Badge color="emerald" variant="light" size="xs">+12%</Badge>
                  </Group>
                  <Title order={3} fw={800}>1.850</Title>
                  <Text size="9px" c="dimmed" mt={4}>Últimos 90 dias</Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={6}>
                <Card radius="20px" padding="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Group justify="space-between" mb="xs">
                    <Text size="xs" c="dimmed" fw={600}>TAXA DE RETORNO</Text>
                    <Badge color="dark" variant="filled" size="xs" style={{ backgroundColor: '#111827' }}>Meta</Badge>
                  </Group>
                  <Title order={3} fw={800}>87%</Title>
                  <Text size="9px" c="dimmed" mt={4}>+4% vs mês anterior</Text>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Satisfacción Ring Progress */}
            <Card radius="20px" padding="xl" withBorder style={{ borderColor: '#e2e8f0' }} mb="md">
              <Group justify="space-between" mb="lg">
                <Text fw={700} size="sm">Satisfação</Text>
                <Text size="xs" c="dimmed">Baseado em 326 avaliações</Text>
              </Group>
              <Group justify="center" align="center">
                <RingProgress
                  size={160}
                  thickness={16}
                  roundCaps
                  sections={[{ value: 85, color: primaryColor }]}
                  label={
                    <div style={{ textAlign: 'center' }}>
                      <Text fw={800} size="xl">4.9</Text>
                      <Text size="9px" c="dimmed">DE 5.0</Text>
                    </div>
                  }
                />
              </Group>
            </Card>

            {/* Tabla de Procedimientos */}
            <Card radius="20px" padding="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="md">
                <Text fw={700} size="sm">Procedimentos em destaque</Text>
                <ActionIcon variant="subtle" color="gray">•••</ActionIcon>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Procedimento</Table.Th>
                    <Table.Th>Realizados</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={600}>Harmonização Facial</Table.Td>
                    <Table.Td>420</Table.Td>
                    <Table.Td><Badge color="teal" variant="light" size="xs">Em alta</Badge></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={600}>Toxina Botulínica</Table.Td>
                    <Table.Td>650</Table.Td>
                    <Table.Td><Badge color="blue" variant="light" size="xs">Estável</Badge></Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Card>
          </Grid.Col>

          {/* COLUMNA DERECHA (4 Cols): Convênios y Agendamientos */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            
            {/* Convênios Ativos */}
            <Card radius="20px" padding="lg" withBorder style={{ borderColor: '#e2e8f0' }} mb="md">
              <Group justify="space-between" mb="md">
                <Text fw={700} size="sm">Convênios Ativos</Text>
                <Text size="xs" c="dimmed">3 vínculos</Text>
              </Group>
              <Stack gap="sm">
                {[
                  { name: 'Unimed', type: 'Nacional', status: 'Ativo', color: 'teal' },
                  { name: 'Bradesco Saúde', type: 'Top Nacional', status: 'Ativo', color: 'teal' },
                  { name: 'SulAmérica', type: 'Executivo', status: 'Pendente', color: 'amber' }
                ].map((item, idx) => (
                  <Group justify="space-between" p="sm" key={idx} style={{ borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Group gap="sm">
                      <Avatar size={36} radius="md" color="gray">{item.name.substring(0, 2).toUpperCase()}</Avatar>
                      <div>
                        <Text size="xs" fw={700}>{item.name}</Text>
                        <Text size="9px" c="dimmed">{item.type}</Text>
                      </div>
                    </Group>
                    <Badge color={item.color} variant="light" size="sm">{item.status}</Badge>
                  </Group>
                ))}
              </Stack>
            </Card>

            {/* Próximos Agendamentos */}
            <Card radius="20px" padding="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
              <Group justify="space-between" mb="md">
                <Text fw={700} size="sm">Próximos Agendamentos</Text>
                <Badge color="teal" variant="light" size="sm">Hoje • 4</Badge>
              </Group>
              <Stack gap="sm">
                {[
                  { patient: 'Mariana Lopes', time: '09:30', type: 'Retorno • Presencial' },
                  { patient: 'Fernanda Costa', time: '10:15', type: 'Primeira consulta' },
                  { patient: 'Patrícia Lima', time: '11:00', type: 'Procedimento' }
                ].map((app, idx) => (
                  <Group justify="space-between" p="sm" key={idx} style={{ borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Group gap="sm">
                      <Avatar size={32} radius="xl" color="teal">{app.patient.charAt(0)}</Avatar>
                      <div>
                        <Text size="xs" fw={700}>{app.patient}</Text>
                        <Text size="9px" c="dimmed">{app.type}</Text>
                      </div>
                    </Group>
                    <Badge color="dark" variant="filled" size="xs" style={{ backgroundColor: '#111827' }}>{app.time}</Badge>
                  </Group>
                ))}
              </Stack>
            </Card>

          </Grid.Col>
        </Grid>

      </div>
    </div>
  );
}