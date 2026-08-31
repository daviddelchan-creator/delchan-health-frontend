"use client";

import { useState } from 'react';
import { Card, Title, Text, Grid, Box, Group, Button, Stack, UnstyledButton, ThemeIcon, ActionIcon, TextInput, Switch, Badge, ScrollArea } from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../../../contexts/TenantContext';
import { IconGripVertical, IconTrash, IconCalendar, IconTypography, IconListDetails, IconNumber123, IconDeviceFloppy, IconCode } from '@tabler/icons-react';

export default function ConstrutorModulosPage() {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [isSaving, setIsSaving] = useState(false);
  const [formTitle, setFormTitle] = useState('Nova Ficha de Admissão');
  const [formItems, setFormItems] = useState<any[]>([
    { id: '1', linkId: 'motivo', text: 'Motivo da consulta', type: 'string', required: true },
    { id: '2', linkId: 'dor', text: 'Nível de Dor (0-10)', type: 'integer', required: true }
  ]);

  const palette = [
    { type: 'string', label: 'Texto Curto', icon: IconTypography, color: 'blue' },
    { type: 'text', label: 'Texto Longo', icon: IconListDetails, color: 'grape' },
    { type: 'integer', label: 'Número', icon: IconNumber123, color: 'orange' },
    { type: 'date', label: 'Data', icon: IconCalendar, color: 'teal' },
    { type: 'boolean', label: 'Verdadeiro / Falso', icon: IconListDetails, color: 'pink' }
  ];

  const handleAddField = (fieldDef: any) => {
    const newItem = {
      id: Date.now().toString(),
      linkId: `campo_${formItems.length + 1}`,
      text: `Novo campo ${fieldDef.label}`,
      type: fieldDef.type,
      required: false
    };
    setFormItems([...formItems, newItem]);
  };

  const handleRemoveField = (id: string) => {
    setFormItems(formItems.filter(item => item.id !== id));
  };

  const handleUpdateField = (id: string, key: string, value: any) => {
    setFormItems(formItems.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const handleSaveQuestionnaire = async () => {
    setIsSaving(true);
    try {
      const questionnaire = {
        resourceType: 'Questionnaire',
        status: 'active',
        title: formTitle,
        item: formItems.map(item => ({
          linkId: item.linkId,
          text: item.text,
          type: item.type,
          required: item.required
        }))
      };

      await medplum.createResource(questionnaire as any);
      alert('Módulo Clínico (Questionnaire) salvo com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o módulo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p="xl" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={900}>Construtor de Módulos</Title>
          <Text c="dimmed" size="sm" mt={4}>Crie formulários e triagens dinâmicas no padrão FHIR Questionnaire.</Text>
        </div>
        <Button color={primaryColor} radius="xl" size="md" leftSection={<IconDeviceFloppy size={18} />} loading={isSaving} onClick={handleSaveQuestionnaire}>
          Publicar Módulo
        </Button>
      </Group>

      <Grid gutter="xl">
        {/* PALETA DE HERRAMIENTAS (Izquierda) */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card radius="xl" p="md" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', position: 'sticky', top: '100px' }}>
            <Text fw={700} size="sm" mb="md" c="dark.9">PALETA DE CAMPOS</Text>
            <Stack gap="sm">
              {palette.map((item, idx) => (
                <UnstyledButton 
                  key={idx} 
                  onClick={() => handleAddField(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', border: '1px solid #eef2f7', backgroundColor: '#fcfcfd', transition: 'all 0.2s', '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' } }}
                >
                  <ThemeIcon color={item.color} variant="light" size="md" radius="md">
                    <item.icon size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600} c="dark.7">{item.label}</Text>
                </UnstyledButton>
              ))}
            </Stack>

            <Box mt="xl" p="md" bg="gray.0" style={{ borderRadius: '16px' }}>
              <Group gap="xs" mb="xs">
                <IconCode size={16} color="#64748b" />
                <Text fw={700} size="xs" c="dimmed">JSON PREVIEW</Text>
              </Group>
              <Text size="xs" c="gray.6" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {`{\n  "resourceType":\n  "Questionnaire",\n  "items": ${formItems.length}\n}`}
              </Text>
            </Box>
          </Card>
        </Grid.Col>

        {/* LIENZO DEL FORMULARIO (Derecha) */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          <Card radius="xl" p="xl" withBorder shadow="sm" style={{ borderColor: '#e2e8f0', minHeight: '600px' }}>
            <TextInput 
              variant="unstyled" 
              size="xl" 
              fw={900} 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.currentTarget.value)}
              styles={{ input: { fontSize: '24px', color: '#0f172a', borderBottom: '2px dashed #e2e8f0', borderRadius: 0, paddingLeft: 0, marginBottom: '24px' } }}
            />

            <ScrollArea style={{ height: 'calc(100vh - 250px)' }} pr="md">
              <Stack gap="md">
                {formItems.map((item) => (
                  <Card key={item.id} radius="lg" p="md" withBorder style={{ borderColor: '#e2e8f0', backgroundColor: '#fcfcfd' }}>
                    <Group wrap="nowrap" align="flex-start">
                      <IconGripVertical size={20} color="#cbd5e1" style={{ cursor: 'grab', marginTop: '10px' }} />
                      
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" mb="xs">
                          <Badge color="gray" variant="light" size="xs" radius="sm">{item.type.toUpperCase()}</Badge>
                          <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveField(item.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>

                        <Grid>
                          <Grid.Col span={{ base: 12, sm: 8 }}>
                            <TextInput 
                              label="Pergunta / Label do Campo" 
                              value={item.text} 
                              onChange={(e) => handleUpdateField(item.id, 'text', e.currentTarget.value)}
                              radius="md"
                              styles={{ input: { backgroundColor: '#ffffff', fontWeight: 600 } }}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, sm: 4 }}>
                            <TextInput 
                              label="ID Interno (linkId)" 
                              value={item.linkId} 
                              onChange={(e) => handleUpdateField(item.id, 'linkId', e.currentTarget.value)}
                              radius="md"
                              styles={{ input: { backgroundColor: '#f1f5f9', color: '#64748b' } }}
                            />
                          </Grid.Col>
                        </Grid>

                        <Group mt="md">
                          <Switch 
                            label={<Text size="sm" fw={500}>Campo Obrigatório</Text>} 
                            color={primaryColor} 
                            checked={item.required} 
                            onChange={(e) => handleUpdateField(item.id, 'required', e.currentTarget.checked)} 
                          />
                        </Group>
                      </div>
                    </Group>
                  </Card>
                ))}

                {formItems.length === 0 && (
                  <Box py="xl" ta="center" style={{ border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                    <Text c="dimmed" fw={500}>Nenhum campo adicionado. Use a paleta lateral.</Text>
                  </Box>
                )}
              </Stack>
            </ScrollArea>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}