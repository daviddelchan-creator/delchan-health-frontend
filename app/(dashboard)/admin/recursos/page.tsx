"use client";

import { useState } from 'react';
import { 
  Group, Title, Text, Button, Card, Grid, Badge, ActionIcon, Menu, Tabs, Stack, TextInput, Select, Switch, Avatar, ThemeIcon, Divider 
} from '@mantine/core';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../../../../contexts/TenantContext';

export default function GestaoRecursosPage() {
  const { dict, clinicType } = useTenant();
  const [activeTab, setActiveTab] = useState<string | null>('espacos');

  // MOCK DATA: Simulando recursos FHIR (Location y Device)
  const [locations] = useState([
    { id: 'L1', name: 'Unidade Central (São Paulo)', type: 'Sede', status: 'Ativo' },
    { id: 'L2', name: `${dict.room} 01 - Premium`, type: dict.room, status: 'Ativo', parent: 'Unidade Central' },
    { id: 'L3', name: `${dict.room} 02 - Standard`, type: dict.room, status: 'Manutenção', parent: 'Unidade Central' },
    { id: 'L4', name: 'Sala de Reuniões / Telemedicina', type: 'Sala Virtual', status: 'Ativo', parent: 'Unidade Central' },
  ]);

  const [devices] = useState([
    { id: 'D1', name: 'Tótem de Autoatendimento A', type: 'Quiosque', location: 'Recepção', status: 'Online' },
    { id: 'D2', name: 'Google Meet Hardware Series One', type: 'Videoconferência', location: 'Sala de Reuniões', status: 'Online' },
    { id: 'D3', name: 'Scanner Plustek SmartOffice', type: 'OCR Scanner', location: 'Recepção', status: 'Offline' },
    { id: 'D4', name: 'Leitor SmartCard (ICP-Brasil)', type: 'Criptografia', location: 'Recepção', status: 'Online' },
  ]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Infraestrutura e Hardware</Title>
          <Text c="dimmed" size="sm">Gerencie unidades, {dict.room.toLowerCase()}s, tótens e equipamentos médicos.</Text>
        </div>
        <Group>
          <Button color="blue" variant="light" radius="md">+ Novo Equipamento</Button>
          <Button color="teal" radius="md">+ Novo Espaço</Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="teal" radius="md">
        <Tabs.List mb="xl">
          <Tabs.Tab value="espacos" fw={600} leftSection="🏢">Gestão de {dict.room}s</Tabs.Tab>
          <Tabs.Tab value="hardware" fw={600} leftSection="🖥️">Equipamentos & Tótens</Tabs.Tab>
          <Tabs.Tab value="config" fw={600} leftSection="⚙️">Configurações de Rede</Tabs.Tab>
        </Tabs.List>

        {/* PESTAÑA 1: GESTIÓN DE ESPACIOS FÍSICOS (FHIR Location) */}
        <Tabs.Panel value="espacos">
          <Grid gutter="lg">
            {/* Formulario Rápido */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Title order={5} fw={700} c="dark.9" mb="md">Cadastrar Estrutura</Title>
                <Stack gap="md">
                  <Select label="Tipo de Espaço" data={['Sede / Edifício', dict.room, 'Sala de Espera', 'Sala de Procedimentos']} defaultValue={dict.room} />
                  <TextInput label="Nome Identificador" placeholder={`Ex: ${dict.room} A`} />
                  <Select label="Unidade Pai (Onde está localizado?)" data={['Nenhuma (É uma Sede)', 'Unidade Central (São Paulo)']} defaultValue="Unidade Central (São Paulo)" />
                  <Switch color="teal" label="Disponível na Agenda Global?" defaultChecked />
                  <Button color="dark.8" mt="sm">Salvar Localização</Button>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Lista de Recursos Físicos */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                {locations.map((loc) => (
                  <Card key={loc.id} p="lg" radius="md" bg="white" withBorder style={{ borderColor: '#f1f5f9' }}>
                    <Group justify="space-between">
                      <Group>
                        <ThemeIcon size="lg" radius="md" color={loc.type === 'Sede' ? 'blue' : 'teal'} variant="light">
                          {loc.type === 'Sede' ? '🏢' : '🚪'}
                        </ThemeIcon>
                        <div>
                          <Text fw={700} c="dark.9">{loc.name}</Text>
                          <Text size="xs" c="dimmed">{loc.type} {loc.parent ? `• Dentro de: ${loc.parent}` : ''}</Text>
                        </div>
                      </Group>
                      <Group>
                        <Badge color={loc.status === 'Ativo' ? 'teal' : 'red'} variant="dot">{loc.status}</Badge>
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection="✏️">Editar Nome</Menu.Item>
                            <Menu.Item leftSection="🔒">Bloquear na Agenda</Menu.Item>
                            <Menu.Item color="red" leftSection="🗑️">Excluir</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* PESTAÑA 2: GESTIÓN DE HARDWARE Y TÓTENS (FHIR Device) */}
        <Tabs.Panel value="hardware">
          <Grid gutter="lg">
            {devices.map((device) => (
              <Grid.Col span={{ base: 12, md: 6 }} key={device.id}>
                <Card p="xl" radius="lg" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                  <Group justify="space-between" mb="md">
                    <Group>
                      <Avatar color="dark.8" radius="sm">
                        {device.type.includes('Quiosque') ? '📱' : device.type.includes('Vídeo') ? '🎥' : '📠'}
                      </Avatar>
                      <div>
                        <Text fw={700} c="dark.9">{device.name}</Text>
                        <Text size="xs" c="dimmed">Tipo: {device.type}</Text>
                      </div>
                    </Group>
                    <Switch color="teal" defaultChecked={device.status === 'Online'} />
                  </Group>
                  <Divider mb="md" color="#f1f5f9" />
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="slate.6">Alocado em: <Text span c="dark.9">{device.location}</Text></Text>
                    <Button variant="light" size="xs" color="blue">Configurar API</Button>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

      </Tabs>
    </div>
  );
}