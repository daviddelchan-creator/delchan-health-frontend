"use client";

import { useEffect, useState } from 'react';
import { Title, Text, Card, Grid, TextInput, Button, Group, FileInput, PasswordInput, Stack, Badge, ThemeIcon, Avatar, Switch, Center, Alert } from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '../../../../contexts/TenantContext';

export default function DoctorSettings() {
  const medplum = useMedplum();
  const profile = useMedplumProfile(); 
  const { tenantConfig } = useTenant();
  
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [registry, setRegistry] = useState('');
  const [mandatorySignature, setMandatorySignature] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // VALIDACIÓN ESTRICTA: Solo leemos los datos si estamos seguros de que es un Profesional
    if (profile?.resourceType === 'Practitioner') {
      const practitioner = profile as Practitioner;
      setName(practitioner.name?.[0]?.text || practitioner.name?.[0]?.given?.join(' ') || '');
      setSpecialty(practitioner.qualification?.[0]?.code?.text || '');
      setRegistry(practitioner.identifier?.[0]?.value || '');
    }
  }, [profile]);

  // BLOQUEO DE SEGURIDAD FRONT-END
  if (!profile || profile.resourceType !== 'Practitioner') {
    return (
      <Center h="70vh">
        <Alert color="red" title="Acesso Restrito" variant="filled" radius="md">
          Esta área é de uso exclusivo para Profissionais de Saúde e Especialistas.
          Seu perfil atual ({profile?.resourceType}) não tem permissão para acessar o Cofre ICP-Brasil.
        </Alert>
      </Center>
    );
  }

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const practitioner = profile as Practitioner;
      const updatedPractitioner: Practitioner = {
        ...practitioner,
        name: [{ text: name, given: name.split(' ') }],
        qualification: [{ code: { text: specialty } }],
        identifier: [{ system: 'CRM', value: registry }]
      };
      await medplum.updateResource(updatedPractitioner);
      alert('Perfil atualizado com sucesso no Medplum!');
    } catch (err) {
      alert('Erro ao atualizar perfil.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800}>Meu Perfil e Assinaturas</Title>
          <Text c="dimmed" size="sm">Gerencie seus dados profissionais, foto e cofre ICP-Brasil.</Text>
        </div>
        <Button color={tenantConfig.internalColor} radius="md" onClick={handleUpdateProfile} loading={loading}>Salvar Alterações</Button>
      </Group>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="lg" withBorder style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Group mb="lg">
              <Avatar size="xl" radius="md" color={tenantConfig.internalColor}>{name.charAt(0)}</Avatar>
              <FileInput placeholder="Alterar foto..." accept="image/png,image/jpeg" size="xs" />
            </Group>
            <Stack gap="md">
              <TextInput label="Nome Completo (Conforme Documento)" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <Group grow>
                <TextInput label="Conselho (Ex: CRM, CRO)" placeholder="Sigla do Conselho" />
                <TextInput label="Número de Registro" value={registry} onChange={(e) => setRegistry(e.currentTarget.value)} />
              </Group>
              <TextInput label="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.currentTarget.value)} />
              <Switch label="Profissional Regulamentado (Assinatura Obrigatória em Prontuários)" checked={mandatorySignature} onChange={(e) => setMandatorySignature(e.currentTarget.checked)} color={tenantConfig.internalColor} />
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="lg" withBorder bg="#f8fafc" style={{ borderColor: '#cbd5e1', height: '100%' }}>
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">🔐</ThemeIcon>
                <Title order={4} c="dark.9">Cofre de Assinatura (e-CPF)</Title>
              </Group>
              <Badge color={mandatorySignature ? "red" : "gray"} variant="dot">{mandatorySignature ? "Exigido por Lei" : "Opcional"}</Badge>
            </Group>
            
            <Text size="sm" c="slate.6" mb="xl" lh={1.6}>
              Faça o upload do seu certificado digital A1. O sistema utilizará este certificado para aplicar a <b>Assinatura Digital ICP-Brasil</b> em PDFs enviados aos pacientes.
            </Text>

            <Stack gap="md">
              <FileInput label="Arquivo PFX/P12 (Seu e-CPF)" placeholder="Selecionar arquivo..." accept=".pfx,.p12" />
              <PasswordInput label="Senha do Certificado (PIN)" placeholder="Digite a senha..." />
              <Button color="blue" mt="md" fullWidth>Armazenar no KMS Criptografado</Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}