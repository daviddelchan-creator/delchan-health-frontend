"use client";

import { Card, Title, Text, Group, Stack, Badge, Button, Switch, Divider, Grid } from '@mantine/core';
import { useTenantModules } from '../../../core/hooks/TenantContext';

export default function ConfigModulesPage() {
  const { activeModules, toggleModule } = useTenantModules();

  return (
    <Stack gap="xl" maw={900}>
      <div>
        <Title order={2} c="slate.9" fw={700}>Configurações do Sistema</Title>
        <Text c="slate.5">Gerencie os módulos contratados e personalize sua operação.</Text>
      </div>

      <Card p="xl" shadow="sm" radius="md" withBorder>
        <Title order={4} mb="lg" c="dark.8">Módulos Essenciais (Plano Base)</Title>
        <Grid>
          <Grid.Col span={12}>
            <Group justify="space-between" p="md" bg="#f8fafc" style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <Text fw={600}>📅 Módulo de Agenda e Consultas</Text>
                <Text size="sm" c="dimmed">Gestão de horários, bloqueios e recursos físicos.</Text>
              </div>
              <Badge color="green" variant="light">Incluído</Badge>
            </Group>
          </Grid.Col>
          <Grid.Col span={12}>
            <Group justify="space-between" p="md" bg="#f8fafc" style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <Text fw={600}>📋 Prontuário Eletrônico (FHIR Medplum)</Text>
                <Text size="sm" c="dimmed">Histórico clínico com suporte a LGPD e HIPAA.</Text>
              </div>
              <Badge color="green" variant="light">Incluído</Badge>
            </Group>
          </Grid.Col>
        </Grid>

        <Divider my="xl" />

        <Title order={4} mb="lg" c="dark.8">Módulos Adicionais (Expansão SaaS)</Title>
        <Stack gap="md">
          
          <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: activeModules.includes('billing') ? '#f0fdf4' : '#ffffff', transition: 'all 0.3s' }}>
            <div>
              <Text fw={600}>💳 Faturamento e PDV Avançado</Text>
              <Text size="sm" c="dimmed">Emissão de notas fiscais, controle de caixa e split de comissões.</Text>
              <Text size="xs" fw={700} c="blue.6" mt={4}>+ R$ 99,90 / mês</Text>
            </div>
            <Switch checked={activeModules.includes('billing')} onChange={() => toggleModule('billing')} color="blue" size="lg" />
          </Group>

          <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: activeModules.includes('crm') ? '#f0fdf4' : '#ffffff', transition: 'all 0.3s' }}>
            <div>
              <Text fw={600}>🤝 CRM e Marketing de Relacionamento</Text>
              <Text size="sm" c="dimmed">Régua de comunicação automatizada, cashback e disparo de WhatsApp.</Text>
              <Text size="xs" fw={700} c="blue.6" mt={4}>+ R$ 149,90 / mês</Text>
            </div>
            <Switch checked={activeModules.includes('crm')} onChange={() => toggleModule('crm')} color="blue" size="lg" />
          </Group>

        </Stack>
      </Card>

      <Group justify="flex-end">
        <Button color="slate.9" size="lg" onClick={() => alert("Configurações salvas no servidor Medplum com sucesso!")}>
          Salvar Alterações e Atualizar Interface
        </Button>
      </Group>
    </Stack>
  );
}