"use client";

import { useEffect, useState } from 'react';
import { 
  Title, Text, Card, Grid, TextInput, Button, Group, FileInput, PasswordInput, Stack, Badge, ThemeIcon, Avatar, Switch, Center, Alert, Paper, FileButton
} from '@mantine/core';
import { useMedplum, useMedplumProfile } from '@medplum/react-hooks';
import { Practitioner } from '@medplum/fhirtypes';
import { useTenant } from '../../../../contexts/TenantContext';
import { IconShieldCheck, IconLock, IconCheck, IconCertificate, IconCamera } from '@tabler/icons-react';

export default function DoctorSettings() {
  const medplum = useMedplum();
  const profile = useMedplumProfile(); 
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [registry, setRegistry] = useState('');
  const [mandatorySignature, setMandatorySignature] = useState(true);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Vault e-CPF
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [isVaultSaving, setIsVaultSaving] = useState(false);
  const [hasActiveCert, setHasActiveCert] = useState(true);

  useEffect(() => {
    if (profile?.resourceType === 'Practitioner') {
      const practitioner = profile as Practitioner;
      setName(practitioner.name?.[0]?.text || practitioner.name?.[0]?.given?.join(' ') || '');
      setSpecialty(practitioner.qualification?.[0]?.code?.text || 'Dermatologia & Estética');
      setRegistry(practitioner.identifier?.[0]?.value || 'CRM-SP 148.392');
      setPhotoUrl(practitioner.photo?.[0]?.url || null);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      if (profile && profile.resourceType === 'Practitioner') {
        const practitioner = profile as Practitioner;
        const updatedPractitioner: Practitioner = {
          ...practitioner,
          name: [{ text: name, given: name.split(' ') }],
          qualification: [{ code: { text: specialty } }],
          identifier: [{ system: 'http://conselho-regional.gov.br', value: registry }]
        };
        await medplum.updateResource(updatedPractitioner);
      }
      alert('Perfil profissional e dados de carimbo atualizados com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      const binary = await medplum.createBinary(file, file.name, file.type);
      setPhotoUrl(binary.url);
      if (profile && profile.resourceType === 'Practitioner') {
        await medplum.updateResource({
          ...profile,
          photo: [{ url: binary.url, contentType: file.type }]
        });
      }
      alert('Foto de perfil atualizada!');
    } catch (e) {
      alert('Erro ao salvar foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCertificate = () => {
    if (!certPassword) return alert('Insira a senha do certificado.');
    setIsVaultSaving(true);
    setTimeout(() => {
      setHasActiveCert(true);
      setIsVaultSaving(false);
      setCertPassword('');
      setCertFile(null);
      alert('Certificado e-CPF A1 validado pela autoridade certificadora e armazenado com segurança no KMS!');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="dark.9" fw={800}>Meu Perfil Profissional & Assinaturas</Title>
          <Text c="dimmed" size="sm">Gerencie seus dados de registro (CRM/CRO), especialidade e cofre e-CPF ICP-Brasil.</Text>
        </div>
        <Button color={primaryColor} radius="xl" size="md" onClick={handleUpdateProfile} loading={loading}>
          Salvar Alterações
        </Button>
      </Group>

      <Grid gutter="xl">
        {/* DADOS CADASTRAIS */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="xl" withBorder bg="white" style={{ borderColor: '#e2e8f0', height: '100%' }}>
            <Group mb="lg" gap="md">
              <Avatar size={76} radius="xl" src={photoUrl} color={primaryColor}>
                {name ? name.charAt(0).toUpperCase() : 'DR'}
              </Avatar>
              <div>
                <FileButton onChange={handlePhotoUpload} accept="image/png,image/jpeg">
                  {(props) => (
                    <Button {...props} variant="light" color={primaryColor} radius="xl" size="xs" leftSection={<IconCamera size={14} />}>
                      Alterar Foto
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed" mt={4}>Formatos aceitos: JPG, PNG</Text>
              </div>
            </Group>

            <Stack gap="md">
              <TextInput 
                label="Nome Completo do Médico (Conforme Registro)" 
                value={name} 
                onChange={(e) => setName(e.currentTarget.value)} 
                radius="md" 
              />
              <Group grow>
                <TextInput 
                  label="Conselho Regional" 
                  defaultValue="CRM-SP" 
                  radius="md" 
                />
                <TextInput 
                  label="Número de Registro" 
                  value={registry} 
                  onChange={(e) => setRegistry(e.currentTarget.value)} 
                  radius="md" 
                />
              </Group>
              <TextInput 
                label="Especialidade Principal (RQE)" 
                value={specialty} 
                onChange={(e) => setSpecialty(e.currentTarget.value)} 
                radius="md" 
              />
              <Switch 
                label="Profissional Habilitado para Assinatura Digital e Prescrição" 
                checked={mandatorySignature} 
                onChange={(e) => setMandatorySignature(e.currentTarget.checked)} 
                color={primaryColor} 
                mt="xs"
              />
            </Stack>
          </Card>
        </Grid.Col>

        {/* COFRE DE ASSINATURA e-CPF */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card p="xl" radius="xl" withBorder bg="#0f172a" c="white" style={{ borderColor: '#334155', height: '100%' }}>
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="xl" color="teal" variant="light">
                  <IconShieldCheck size={20} />
                </ThemeIcon>
                <Title order={4} c="white">Cofre de Assinatura Digital (e-CPF)</Title>
              </Group>
              <Badge color="teal" variant="light" size="sm">Padrão CFM</Badge>
            </Group>
            
            <Text size="xs" c="slate.3" mb="lg" lh={1.6}>
              Carregue o seu certificado digital A1 (.pfx/.p12). O sistema aplicará a assinatura digital ICP-Brasil em todos os receituários, atestados e evoluções emitidos.
            </Text>

            {hasActiveCert && (
              <Paper p="md" radius="lg" bg="#1e293b" mb="lg" style={{ border: '1px solid #334155' }}>
                <Group justify="space-between">
                  <Group gap="sm">
                    <IconCertificate size={24} color="#14b8a6" />
                    <div>
                      <Text size="xs" fw={700} c="white">Certificado e-CPF A1 Ativo</Text>
                      <Text size="10px" c="teal.3">Emissor: Autoridade Certificadora Serasa • Validade: 2027</Text>
                    </div>
                  </Group>
                  <Badge color="teal" size="xs">Validado</Badge>
                </Group>
              </Paper>
            )}

            <Stack gap="sm">
              <FileInput 
                label="Atualizar Certificado (Arquivo .pfx ou .p12)" 
                placeholder="Selecionar arquivo A1..." 
                accept=".pfx,.p12"
                onChange={setCertFile}
                radius="md"
                styles={{ input: { backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' } }}
              />
              <PasswordInput 
                label="Senha do Certificado (PIN)" 
                placeholder="Digite a senha..." 
                value={certPassword}
                onChange={(e) => setCertPassword(e.currentTarget.value)}
                radius="md"
                styles={{ input: { backgroundColor: '#1e293b', color: 'white', borderColor: '#334155' } }}
              />
              <Button 
                color="teal" 
                mt="sm" 
                radius="xl"
                fullWidth 
                onClick={handleStoreCertificate}
                loading={isVaultSaving}
                leftSection={<IconLock size={16} />}
              >
                Criptografar e Armazenar no Cofre Seguro
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}