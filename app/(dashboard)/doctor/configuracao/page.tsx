"use client";

import { Title, Text, Card, Grid, TextInput, Button, Group, FileInput, PasswordInput, Stack, Badge, ThemeIcon, Divider } from '@mantine/core';

export default function DoctorSettings() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>Meu Perfil e Assinaturas</Title>
          <Text c="dimmed" size="sm">Gerencie seus dados profissionais e certificado digital (ICP-Brasil).</Text>
        </div>
        <Button color="teal" radius="md">Salvar Alterações</Button>
      </Group>

      <Grid gutter="xl">
        {/* DADOS PROFISSIONAIS */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="lg" withBorder style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Title order={4} mb="md">Dados do Profissional</Title>
            <Stack gap="md">
              <TextInput label="Nome Completo" defaultValue="Dr. Alberto Silva" />
              <Group grow>
                <TextInput label="Conselho (Ex: CRM, CRO)" defaultValue="CRM-SP" />
                <TextInput label="Número de Registro" defaultValue="123456" />
              </Group>
              <TextInput label="Especialidade" defaultValue="Cardiologia" />
              
              <Divider my="sm" />
              
              <Text fw={700} size="sm">Assinatura Visual (Carimbo Físico)</Text>
              <Text size="xs" c="dimmed" mb="sm">Imagem escaneada que aparecerá nos PDFs impressos.</Text>
              <FileInput placeholder="Upload da assinatura (PNG sem fundo)..." accept="image/png" />
            </Stack>
          </Card>
        </Grid.Col>

        {/* COFRE DE ASSINATURA DIGITAL (e-CPF) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="lg" withBorder bg="#f8fafc" style={{ borderColor: '#cbd5e1', height: '100%' }}>
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">🔐</ThemeIcon>
                <Title order={4} c="dark.9">Certificado e-CPF (A1)</Title>
              </Group>
              <Badge color="red" variant="dot">Pendente</Badge>
            </Group>
            
            <Text size="sm" c="slate.6" mb="xl" lh={1.6}>
              Faça o upload do seu certificado digital A1. Ele será usado para realizar a <b>Assinatura Digital ICP-Brasil</b> em todos os prontuários, atestados e receitas emitidos por você, garantindo validade legal (verificável no Adobe Reader ou ITI).
            </Text>

            <Stack gap="md">
              <FileInput label="Arquivo PFX/P12 (Seu e-CPF)" placeholder="Selecionar arquivo..." accept=".pfx,.p12" />
              <PasswordInput label="Senha do Certificado (PIN)" placeholder="Digite a senha..." />
              <Button color="blue" mt="md" fullWidth>Sincronizar com Cofre KMS Pessoal</Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}