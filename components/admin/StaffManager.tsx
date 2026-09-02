"use client";

import { useState, useEffect } from 'react';
import { Card, Group, Text, Button, Table, Badge, ActionIcon, Modal, TextInput, Select, Checkbox, Stack, Avatar, ThemeIcon } from '@mantine/core';
import { IconEdit, IconTrash, IconUserPlus, IconShieldLock } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';

export function StaffManager() {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [staff, setStaff] = useState<any[]>([]);
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado del formulario del empleado
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'doctor',
    modules: { agenda: true, prontuario: true, financeiro: false }
  });

  // Simulamos la carga de Practitioners
  useEffect(() => {
    medplum.search('Practitioner').then(bundle => {
      setStaff(bundle.entry?.map(e => e.resource) || []);
    }).catch(console.error);
  }, [medplum]);

  const handleSaveEmployee = async () => {
    setLoading(true);
    try {
      // 1. Crear el recurso Practitioner (Empleado)
      const newPractitioner = await medplum.createResource({
        resourceType: 'Practitioner',
        name: [{ given: [formData.firstName], family: formData.lastName }],
        telecom: [{ system: 'email', value: formData.email }]
      });

      // 2. Aquí conectaríamos con auth/register para enviarle la invitación
      // y enlazar el AccessPolicy según los módulos seleccionados.
      
      setStaff([newPractitioner, ...staff]);
      setOpened(false);
      setFormData({ firstName: '', lastName: '', email: '', role: 'doctor', modules: { agenda: true, prontuario: true, financeiro: false } });
    } catch (error) {
      console.error(error);
      alert("Erro ao criar perfil.");
    }
    setLoading(false);
  };

  return (
    <Card radius="xl" p="xl" withBorder style={{ borderColor: '#e2e8f0' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Text fw={700} size="lg" c="dark.9">Equipe e Controle de Acesso</Text>
          <Text size="xs" c="dimmed">Gerencie médicos, especialistas e recepcionistas.</Text>
        </div>
        <Button color={primaryColor} radius="xl" leftSection={<IconUserPlus size={16} />} onClick={() => setOpened(true)}>
          Novo Colaborador
        </Button>
      </Group>

      <Table verticalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th c="dimmed" fw={600} fz="xs">COLABORADOR</Table.Th>
            <Table.Th c="dimmed" fw={600} fz="xs">PAPEL</Table.Th>
            <Table.Th c="dimmed" fw={600} fz="xs">MÓDULOS LIBERADOS</Table.Th>
            <Table.Th c="dimmed" fw={600} fz="xs" ta="right">AÇÕES</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {staff.map((person, idx) => (
            <Table.Tr key={person.id || idx}>
              <Table.Td>
                <Group gap="sm">
                  <Avatar color={primaryColor} radius="xl">{person.name?.[0]?.given?.[0]?.charAt(0) || 'U'}</Avatar>
                  <div>
                    <Text size="sm" fw={600}>{person.name?.[0]?.given?.join(' ')} {person.name?.[0]?.family}</Text>
                    <Text size="xs" c="dimmed">{person.telecom?.[0]?.value || 'Sem email'}</Text>
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Badge color="gray" variant="light" radius="sm">Acesso Clínico</Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Badge color="blue" variant="dot" size="xs">Agenda</Badge>
                  <Badge color="teal" variant="dot" size="xs">Prontuário</Badge>
                </Group>
              </Table.Td>
              <Table.Td ta="right">
                <Group gap="xs" justify="flex-end">
                  <ActionIcon variant="light" color="gray" radius="md"><IconEdit size={16} /></ActionIcon>
                  <ActionIcon variant="light" color="red" radius="md"><IconTrash size={16} /></ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {staff.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center" py="xl">
                <Text c="dimmed" size="sm">Nenhum colaborador registrado nesta clínica.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* MODAL DE CREACIÓN DE EMPLEADOS */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Configurar Acesso de Colaborador" centered radius="xl" size="lg">
        <Stack gap="md">
          <Group grow>
            <TextInput label="Nome" placeholder="Ex: Rafael" required radius="md" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <TextInput label="Sobrenome" placeholder="Ex: Monteiro" required radius="md" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </Group>
          <TextInput label="Email Corporativo" placeholder="email@clinica.com" required radius="md" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          
          <Select 
            label="Papel / Especialidade" 
            data={[
              { value: 'admin', label: 'Administrador (Acesso Total)' },
              { value: 'doctor', label: 'Médico Clínico' },
              { value: 'esthetician', label: 'Especialista em Estética / Cosmetologia' },
              { value: 'reception', label: 'Recepção / Agendamento' }
            ]} 
            radius="md"
            value={formData.role}
            onChange={(val) => setFormData({...formData, role: val || 'doctor'})}
          />

          <Card radius="md" bg="#f8fafc" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Text size="sm" fw={600} mb="xs">Permissões de Módulo</Text>
            <Text size="xs" c="dimmed" mb="md">Defina o que este usuário pode acessar na plataforma.</Text>
            <Stack gap="xs">
              <Checkbox color={primaryColor} label="Agenda Inteligente" description="Pode criar e editar agendamentos." checked={formData.modules.agenda} onChange={e => setFormData({...formData, modules: {...formData.modules, agenda: e.target.checked}})} />
              <Checkbox color={primaryColor} label="Prontuário Eletrônico (EHR)" description="Acesso a evolução clínica e histórico." checked={formData.modules.prontuario} onChange={e => setFormData({...formData, modules: {...formData.modules, prontuario: e.target.checked}})} />
              <Checkbox color={primaryColor} label="Gestão Financeira" description="Acesso a faturamento, guias TISS e PDV." checked={formData.modules.financeiro} onChange={e => setFormData({...formData, modules: {...formData.modules, financeiro: e.target.checked}})} />
            </Stack>
          </Card>

          <Button color={primaryColor} radius="xl" size="md" mt="md" loading={loading} onClick={handleSaveEmployee}>
            Enviar Convite de Acesso
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}