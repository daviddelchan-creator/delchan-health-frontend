"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMedplumProfile, SignInForm } from '@medplum/react';
import { Center, Card, Title, Text, MantineProvider, Group, ThemeIcon, Box } from '@mantine/core';

// Tema súper limpio estilo Stripe / Google Cloud para el Login (Sin fontFamily para evitar errores)
const loginTheme = {
  primaryColor: 'blue',
};

export default function LandingPage() {
  const router = useRouter();
  const profile = useMedplumProfile();

  // EFECTO DE ENRUTAMIENTO INTELIGENTE (RBAC)
  useEffect(() => {
    if (profile) {
      // Si el usuario ya inició sesión, revisamos su "Rol" en FHIR
      const userType = profile.resourceType;

      if (userType === 'Patient') {
        router.push('/patient'); // Va ao portal do paciente
      } else if (userType === 'Practitioner') {
        router.push('/doctor'); // Va ao Clinical Hub (Médicos)
      } else {
        router.push('/admin'); // Por defecto, administradores vão ao Command Center
      }
    }
  }, [profile, router]);

  // Si ya hay sesión, mostramos pantalla de carga mientras redirige
  if (profile) {
    return (
      <Center h="100vh" bg="#f8fafc">
        <Text c="dimmed" size="sm" fw={500}>Redirecionando para o seu portal seguro...</Text>
      </Center>
    );
  }

  // SI NO HAY SESIÓN: Mostramos el Login Enterprise 2030
  return (
    <MantineProvider theme={loginTheme}>
      <Box style={{ 
        height: '100vh', 
        backgroundColor: '#f1f5f9', 
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', 
        backgroundSize: '20px 20px' // Fondo técnico de puntos
      }}>
        <Center h="100%">
          <Card shadow="xl" padding={40} radius="md" withBorder w={420} bg="white" style={{ borderColor: '#e2e8f0' }}>
            <Group justify="center" mb="md">
              <ThemeIcon size="xl" radius="md" color="blue.9" variant="filled">
                <Text fw={900} size="lg">DH</Text>
              </ThemeIcon>
            </Group>
            
            <Title order={3} ta="center" c="dark.8" fw={700} style={{ letterSpacing: '-0.5px' }}>
              Delchan Health <Text span c="blue.6" fw={400}>OS</Text>
            </Title>
            
            <Text c="dimmed" ta="center" size="sm" mt="xs" mb="xl">
              Sistema Operacional Clínico de Alta Performance. Insira suas credenciais corporativas.
            </Text>

            <SignInForm onSuccess={() => {
              console.log("Login exitoso");
            }} />

            <Text c="dimmed" ta="center" size="xs" mt="xl" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              Protegido por criptografia de ponta a ponta (HIPAA & LGPD compliance).
            </Text>
          </Card>
        </Center>
      </Box>
    </MantineProvider>
  );
}