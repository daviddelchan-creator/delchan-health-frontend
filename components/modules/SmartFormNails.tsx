"use client";

import { useState } from 'react';
import { Card, Grid, TextInput, Switch, Stack, Group, Title, Button, Select, Textarea, Divider, ThemeIcon, Text, Badge } from '@mantine/core';

interface SmartFormNailsProps {
  patientData: any;
  onUpdatePatient: (newData: any) => void;
  onRequestSignature: () => void;
}

export function SmartFormNails({ patientData, onUpdatePatient, onRequestSignature }: SmartFormNailsProps) {
  // 1. DADOS PESSOAIS (Bidireccional)
  const [phone, setPhone] = useState(patientData.telecom?.[0]?.value || '');
  
  // 2. HISTÓRICO CLÍNICO (Condicionales)
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasAllergies, setHasAllergies] = useState(false);
  
  // 3. TÉCNICA APLICADA
  const [technique, setTechnique] = useState<string | null>(null);

  // Sincronización en tiempo real con el EMPI central
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    onUpdatePatient({ ...patientData, telecom: [{ system: 'phone', value: val }] });
  };

  return (
    <Card p="xl" radius="md" withBorder bg="#f8fafc" style={{ borderColor: '#cbd5e1' }}>
      <Group justify="space-between" mb="lg">
        <Group>
          <ThemeIcon size="lg" color="grape" radius="md" variant="light">💅</ThemeIcon>
          <Title order={4} c="dark.9">Avaliação: Alongamento de Unhas</Title>
        </Group>
        <Badge color="grape" variant="dot">Módulo Especializado</Badge>
      </Group>

      {/* DADOS PESSOAIS SYNC */}
      <Text fw={700} size="sm" c="slate.6" mb="md" tt="uppercase">Sincronização de Cadastro</Text>
      <Grid mb="xl">
        <Grid.Col span={6}>
          <TextInput label="Nome Completo" defaultValue={patientData.name?.[0]?.given?.join(' ')} disabled />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Celular (Sincronizado)" value={phone} onChange={(e) => handlePhoneChange(e.currentTarget.value)} />
        </Grid.Col>
      </Grid>

      <Divider my="lg" color="#e2e8f0" />

      {/* HISTÓRICO DE SAÚDE */}
      <Text fw={700} size="sm" c="slate.6" mb="md" tt="uppercase">Histórico de Saúde e Hábitos</Text>
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Switch label="Está gestante?" checked={isPregnant} onChange={(e) => setIsPregnant(e.currentTarget.checked)} color="grape" fw={500} />
              {isPregnant && <TextInput placeholder="Quantas semanas?" size="xs" w={150} />}
            </Group>
            
            <Group justify="space-between">
              <Switch label="Diabetes?" checked={hasDiabetes} onChange={(e) => setHasDiabetes(e.currentTarget.checked)} color="grape" fw={500} />
              {hasDiabetes && <TextInput placeholder="Qual grau?" size="xs" w={150} />}
            </Group>

            <Group justify="space-between">
              <Switch label="Alergia a esmaltes/cosméticos?" checked={hasAllergies} onChange={(e) => setHasAllergies(e.currentTarget.checked)} color="grape" fw={500} />
              {hasAllergies && <TextInput placeholder="Quais?" size="xs" w={150} />}
            </Group>
            
            <Switch label="Costuma retirar a cutícula?" color="grape" fw={500} />
            <Switch label="Pratica esportes?" color="grape" fw={500} />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Switch label="A lâmina ungueal apresenta deformação?" color="grape" fw={500} />
            <Switch label="Tem micoses/fungos?" color="grape" fw={500} />
            <Switch label="Tem o hábito de roer unhas?" color="grape" fw={500} />
            <Switch label="Frequenta piscinas/praias com frequência?" color="grape" fw={500} />
            <Textarea placeholder="Outras observações clínicas..." minRows={2} />
          </Stack>
        </Grid.Col>
      </Grid>

      <Divider my="lg" color="#e2e8f0" />

      {/* TÉCNICA E PROCEDIMENTO */}
      <Text fw={700} size="sm" c="slate.6" mb="md" tt="uppercase">Procedimento e TCLE</Text>
      <Grid align="flex-end">
        <Grid.Col span={4}>
          <Select 
            label="Técnica Aplicada" 
            data={['Gel', 'Acrigel', 'Porcelana', 'Fibra de Vidro', 'Outra']} 
            value={technique}
            onChange={setTechnique}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="Cor / Formato" placeholder="Ex: Bailarina / Nude" />
        </Grid.Col>
        <Grid.Col span={4}>
          <Button fullWidth color="red" variant="light" onClick={onRequestSignature} leftSection="⚠️">
            Solicitar Assinatura (TCLE)
          </Button>
        </Grid.Col>
      </Grid>
      
      <Text size="xs" c="dimmed" mt="sm">
        *O envio da assinatura autoriza o registro fotográfico de "Antes e Depois" e programa o retorno automático baseado na técnica.
      </Text>
    </Card>
  );
}