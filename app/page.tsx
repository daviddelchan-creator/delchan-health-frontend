"use client";

import { useState } from 'react';
import { Paper, Title, Text, Container, Group, Box, TextInput, PasswordInput, Button, Alert, Divider, Stack } from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { IconStethoscope, IconShieldCheck, IconUser, IconLogin } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Inicia login no servidor Medplum
      let loginResponse = await medplum.startLogin({ email, password });

      // 2. Seleção de perfil automática se múltiplos
      if (!loginResponse.code && loginResponse.memberships && loginResponse.memberships.length > 0) {
        loginResponse = await medplum.post('auth/profile', {
          login: loginResponse.login,
          profile: loginResponse.memberships[0].id,
        });
      }

      // 3. Processamento do código
      if (loginResponse.code) {
        await medplum.processCode(loginResponse.code);
      } else {
        throw new Error("Credenciais inválidas ou falha ao autenticar no servidor.");
      }

      // 4. Roteamento por perfil
      const activeProfile = medplum.getProfile();
      if (activeProfile?.resourceType === 'Patient') {
        router.push('/patient');
      } else if (activeProfile?.resourceType === 'Practitioner') {
        router.push('/doctor');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      setError(err?.message || "Email ou senha incorretos. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Box 
        style={{ 
          flex: 1, 
          backgroundImage: `url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000&auto=format&fit=crop')`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          position: 'relative'
        }}
        visibleFrom="sm"
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: primaryColor, opacity: 0.82 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '4rem', color: 'white', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <Title order={1} size="h1" fw={900} mb="md">Delchan Health OS</Title>
          <Text size="lg" maw={520} lh={1.6}>
            Sistema Operacional Clínico de alta performance, prontuário eletrônico FHIR R4, CRM omnichannel e conformidade LGPD & ICP-Brasil.
          </Text>
        </div>
      </Box>

      <Container size="sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Paper radius="xl" p="2.5rem" w="100%" maw={460} bg="white" withBorder style={{ borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Group justify="center" mb="lg">
            <div style={{ backgroundColor: primaryColor, color: 'white', padding: '12px 18px', borderRadius: '14px', fontWeight: 900, fontSize: '24px' }}>
              {tenantConfig?.name ? tenantConfig.name.substring(0, 2).toUpperCase() : 'DH'}
            </div>
          </Group>
          
          <Title order={2} ta="center" fw={800} c="dark.9">{tenantConfig?.name || 'Delchan Health OS'}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={4} mb="xl">
            Insira suas credenciais corporativas
          </Text>

          <form onSubmit={handleLogin}>
            {error && (
              <Alert color="red" mb="md" radius="md" title="Falha de Autenticação">
                {error}
              </Alert>
            )}

            <TextInput 
              label="E-mail Corporativo" 
              placeholder="medico@delchan.com" 
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              radius="md"
              size="md"
              mb="md"
            />
            
            <PasswordInput 
              label="Senha de Acesso" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              radius="md"
              size="md"
              mb="xl"
            />

            <Button 
              type="submit" 
              fullWidth 
              size="md" 
              radius="xl" 
              color={primaryColor}
              loading={loading}
              leftSection={<IconLogin size={18} />}
            >
              Entrar no Sistema
            </Button>
          </form>

          <Divider my="xl" label="Ou acesse diretamente pelos atalhos" labelPosition="center" color="#e2e8f0" />

          {/* ATALHOS RÁPIDOS DE NAVEGAÇÃO */}
          <Stack gap="xs">
            <Button 
              variant="light" 
              color="teal" 
              radius="xl" 
              fullWidth 
              leftSection={<IconStethoscope size={16} />}
              onClick={() => router.push('/doctor')}
            >
              Acesso Painel do Médico (/doctor)
            </Button>
            <Button 
              variant="light" 
              color="dark" 
              radius="xl" 
              fullWidth 
              leftSection={<IconShieldCheck size={16} />}
              onClick={() => router.push('/admin')}
            >
              Acesso Super Admin (/admin)
            </Button>
            <Button 
              variant="subtle" 
              color="blue" 
              radius="xl" 
              fullWidth 
              leftSection={<IconUser size={16} />}
              onClick={() => router.push('/patient')}
            >
              Portal do Paciente (/patient)
            </Button>
          </Stack>

          <Text ta="center" size="xs" c="dimmed" mt="xl">
            Protegido por criptografia TLS 1.3 & LGPD compliance.
          </Text>
        </Paper>
      </Container>
    </div>
  );
}