"use client";

import { Center, Card, Title, Text, Button, Stack, MantineProvider } from '@mantine/core';
import { useMedplumProfile, SignInForm } from '@medplum/react';
import { useRouter } from 'next/navigation';

export default function SaaSGateway() {
  const profile = useMedplumProfile();
  const router = useRouter();

  // Si no hay sesión, mostramos el login centralizado
  if (!profile) {
    return (
      <MantineProvider>
        <Center h="100vh" bg="#f8f9fa">
          <Card shadow="md" p="xl" radius="md" w={420} withBorder>
            <Title order={3} ta="center" mb="lg" c="teal">Bienvenido al SaaS Enterprise</Title>
            <Text c="dimmed" ta="center" mb="xl" size="sm">
              Inicie sesión para acceder a su entorno de salud.
            </Text>
            <SignInForm onSuccess={() => window.location.reload()} />
          </Card>
        </Center>
      </MantineProvider>
    );
  }

  // Si hay sesión, mostramos el selector de módulos del SaaS
  return (
    <MantineProvider>
      <Center h="100vh" bg="#f8f9fa">
        <Card shadow="xl" p="xl" radius="md" w={500} withBorder>
          <Title order={3} ta="center" mb="sm" c="teal">Portal de Acceso SaaS</Title>
          <Text c="dimmed" ta="center" mb="xl" size="sm">
            Seleccione el módulo al que desea ingresar según su perfil:
          </Text>

          <Stack>
            <Button 
              size="lg" 
              color="teal" 
              variant="light" 
              onClick={() => router.push('/admin')}
            >
              👑 Entrar al Panel Administrativo
            </Button>
            
            <Button 
              size="lg" 
              color="blue" 
              variant="light" 
              onClick={() => router.push('/doctor')}
            >
              🩺 Entrar a la Vista del Médico / Especialista
            </Button>
            
            <Button 
              size="lg" 
              color="grape" 
              variant="light" 
              onClick={() => router.push('/patient')}
            >
              👤 Entrar al Portal del Paciente
            </Button>
          </Stack>
        </Card>
      </Center>
    </MantineProvider>
  );
}