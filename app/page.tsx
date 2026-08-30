"use client";

import { useState } from 'react';
import { Paper, Title, Text, Container, Group, Box, TextInput, PasswordInput, Button, Alert } from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';
import { useRouter } from 'next/navigation';
import { useTenant } from '../contexts/TenantContext';

export default function LoginPage() {
  const router = useRouter();
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Iniciamos el login
      let loginResponse = await medplum.startLogin({ email, password });

      // 2. CORRECCIÓN: Usamos el ID de la membresía, no la referencia del perfil
      if (!loginResponse.code && loginResponse.memberships && loginResponse.memberships.length > 0) {
        console.log("Seleccionando perfil principal automaticamente...");
        loginResponse = await medplum.post('auth/profile', {
          login: loginResponse.login,
          profile: loginResponse.memberships[0].id, // <-- EL CAMBIO ESTÁ AQUÍ
        });
      }

      // 3. Procesamos el código para obtener el Token definitivo
      if (loginResponse.code) {
        await medplum.processCode(loginResponse.code);
      } else {
        throw new Error("Falha ao gerar o token de segurança.");
      }

      // 4. Enrutamiento seguro
      const activeProfile = medplum.getProfile();
      
      if (activeProfile?.resourceType === 'Patient') {
        router.push('/patient');
      } else if (activeProfile?.resourceType === 'Practitioner') {
        router.push('/doctor');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      console.error("Error en autenticación:", err);
      setError(err?.message || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tenantConfig?.internalColor || '#0d9488', opacity: 0.8 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '4rem', color: 'white', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <Title order={1} size="h1" fw={900} mb="md">Sistema Operacional Clínico</Title>
          <Text size="lg" maw={500}>Alta performance, criptografia de ponta a ponta e integração nativa com e-CNPJ e prontuários eletrônicos.</Text>
        </div>
      </Box>

      <Container size="sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper radius="md" p="xl" w="100%" maw={450}>
          <Group justify="center" mb="xl">
            <div style={{ backgroundColor: tenantConfig?.internalColor || '#0d9488', color: 'white', padding: '10px 15px', borderRadius: '8px', fontWeight: 900, fontSize: '24px' }}>
              {tenantConfig?.name ? tenantConfig.name.substring(0, 2).toUpperCase() : 'DH'}
            </div>
          </Group>
          
          <Title order={2} ta="center" fw={800} c="dark.9">{tenantConfig?.name || 'Delchan Health OS'}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
            Insira suas credenciais corporativas
          </Text>

          <form onSubmit={handleLogin}>
            {error && (
              <Alert color="red" mb="md" radius="md">
                {error}
              </Alert>
            )}

            <TextInput 
              label="Email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              radius="md"
              size="md"
            />
            
            <PasswordInput 
              label="Senha" 
              placeholder="medplum_admin" 
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              mt="md"
              radius="md"
              size="md"
            />

            <Button 
              type="submit" 
              fullWidth 
              mt="xl" 
              size="md" 
              radius="md" 
              color={tenantConfig?.internalColor || 'teal'}
              loading={loading}
            >
              Entrar no Sistema
            </Button>
          </form>

          <Text ta="center" size="xs" c="dimmed" mt="xl">Protegido por criptografia HIPAA & LGPD compliance.</Text>
        </Paper>
      </Container>
    </div>
  );
}