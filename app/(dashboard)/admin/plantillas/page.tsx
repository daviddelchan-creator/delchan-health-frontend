"use client";

import { useState } from 'react';
import { Card, Title, Text, Grid, Box, Group, Button, Stack, UnstyledButton, ThemeIcon, ActionIcon, TextInput, Badge, ScrollArea, Textarea } from '@mantine/core';
import { useTenant } from '../../../../contexts/TenantContext';
import { IconDeviceFloppy, IconPlus, IconFileText, IconTrash, IconTemplate } from '@tabler/icons-react';

export default function PlantillasTiptapPage() {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [activeTemplate, setActiveTemplate] = useState<string>('1');
  const [templates, setTemplates] = useState([
    { id: '1', title: 'Evolução SOAP', content: 'S (Subjetivo):\n\nO (Objetivo):\n\nA (Avaliação):\n\nP (Plano):', status: 'Ativo' },
    { id: '2', title: 'Anamnese Geral', content: 'HDA (História da Doença Atual):\n\nHPP (História Patológica Pregressa):\n\nMedicamentos em uso:\n\nAlergias:', status: 'Ativo' }
  ]);

  const handleSave = () => {
    // Aquí el Admin guarda la plantilla como un recurso "Basic" o "PlanDefinition" en Medplum
    // para que el doctor la consuma en la clínica.
    alert("Plantilla salva e sincronizada para todos os médicos da clínica!");
  };

  const handleContentChange = (val: string) => {
    setTemplates(templates.map(t => t.id === activeTemplate ? { ...t, content: val } : t));
  };

  const currentTpl = templates.find(t => t.id === activeTemplate);

  return (
    <Box p="xl" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={900}>Gestor de Plantillas Clínicas</Title>
          <Text c="dimmed" size="sm" mt={4}>Crie modelos de texto estruturado para acelerar o atendimento médico.</Text>
        </div>
        <Button color={primaryColor} radius="xl" size="md" leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave}>
          Sincronizar Plantillas
        </Button>
      </Group>

      <Grid gutter="xl">
        {/* LISTA DE PLANTILLAS (Izquierda) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: 'calc(100vh - 160px)' }}>
            <Group justify="space-between" mb="md">
              <Text fw={700} size="sm" c="dark.9">MODELOS SALVOS</Text>
              <ActionIcon variant="light" color={primaryColor} radius="xl"><IconPlus size={16} /></ActionIcon>
            </Group>
            <Stack gap="xs">
              {templates.map((tpl) => (
                <UnstyledButton 
                  key={tpl.id} 
                  onClick={() => setActiveTemplate(tpl.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', 
                    border: `1px solid ${activeTemplate === tpl.id ? primaryColor : '#eef2f7'}`, 
                    backgroundColor: activeTemplate === tpl.id ? `${primaryColor}10` : '#fcfcfd', 
                    transition: 'all 0.2s' 
                  }}
                >
                  <ThemeIcon color={activeTemplate === tpl.id ? primaryColor : 'gray'} variant={activeTemplate === tpl.id ? 'filled' : 'light'} size="md" radius="md">
                    <IconTemplate size={16} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={600} c={activeTemplate === tpl.id ? primaryColor : 'dark.7'}>{tpl.title}</Text>
                  </div>
                  {activeTemplate === tpl.id && <IconFileText size={16} color={primaryColor} />}
                </UnstyledButton>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        {/* CREADOR TIPTAP (Derecha) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card radius="xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="xl">
              <TextInput 
                variant="unstyled" 
                size="xl" 
                fw={900} 
                value={currentTpl?.title} 
                styles={{ input: { fontSize: '24px', color: '#0f172a', borderBottom: '2px dashed #e2e8f0', borderRadius: 0, paddingLeft: 0, width: '400px' } }}
              />
              <Group>
                <Badge color="teal" variant="light" size="lg" radius="sm">Status: Ativo</Badge>
                <ActionIcon color="red" variant="subtle" size="lg"><IconTrash size={20} /></ActionIcon>
              </Group>
            </Group>

            {/* SIMULADOR DE BARRA DE HERRAMIENTAS TIPTAP */}
            <Group gap="xs" p="xs" bg="#f8fafc" style={{ borderRadius: '12px 12px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
              <Badge color="gray" variant="outline" radius="sm">Negrito</Badge>
              <Badge color="gray" variant="outline" radius="sm">Itálico</Badge>
              <Badge color="gray" variant="outline" radius="sm">Lista</Badge>
              <Badge color="gray" variant="outline" radius="sm">Variáveis do Paciente [@]</Badge>
            </Group>

            <Textarea 
              value={currentTpl?.content}
              onChange={(e) => handleContentChange(e.currentTarget.value)}
              styles={{ 
                input: { 
                  flex: 1, 
                  minHeight: '400px', 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '0 0 12px 12px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace'
                } 
              }}
            />
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}