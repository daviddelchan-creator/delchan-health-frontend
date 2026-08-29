"use client";

import { Paper, Title, Text, Container, Group, Box } from '@mantine/core';
import { SignInForm } from '@medplum/react';
import { useRouter } from 'next/navigation';

// IMPORTAMOS EL CEREBRO GLOBAL
import { useTenant } from '../contexts/TenantContext';

export default function LoginPage() {
  const router = useRouter();
  const { tenantConfig } = useTenant();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* LADO IZQUIERDO: IMAGEN DE FONDO */}
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tenantConfig.internalColor, opacity: 0.8 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '4rem', color: 'white', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          <Title order={1} size="h1" fw={900} mb="md">Sistema Operacional Clínico</Title>
          <Text size="lg" maw={500}>Alta performance, criptografia de ponta a ponta e integração nativa com e-CNPJ e prontuários eletrônicos.</Text>
        </div>
      </Box>

      {/* LADO DERECHO: FORMULARIO OFICIAL MEDPLUM */}
      <Container size="sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper radius="md" p="xl" w="100%" maw={450}>
          <Group justify="center" mb="xl">
            <div style={{ backgroundColor: tenantConfig.internalColor, color: 'white', padding: '10px 15px', borderRadius: '8px', fontWeight: 900, fontSize: '24px' }}>
              {tenantConfig.name.substring(0, 2).toUpperCase()}
            </div>
          </Group>
          
          <Title order={2} ta="center" fw={800} c="dark.9">{tenantConfig.name}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
            Insira suas credenciais corporativas
          </Text>

          {/* MOTOR OFICIAL: Gestiona contraseñas, selección de proyectos y 2FA solo si es requerido */}
          <div style={{ 
            '--medplum-primary-color': tenantConfig.internalColor,
            '--mantine-color-blue-filled': tenantConfig.internalColor
          } as React.CSSProperties}>
            <SignInForm 
              onSuccess={() => {
                console.log("Login 100% completo. Token firme.");
                router.push('/admin');
              }} 
            />
          </div>

          <Text ta="center" size="xs" c="dimmed" mt="xl">Protegido por criptografia HIPAA & LGPD compliance.</Text>
        </Paper>
      </Container>
    </div>
  );
}