import { Stack } from 'expo-router';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider as ReactMedplumProvider } from '@medplum/react-hooks';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' && !baseUrl) {
    console.warn('API URL não configurada. Configure a variável EXPO_PUBLIC_API_URL no ambiente mobile.');
}

const medplum = new MedplumClient({
  baseUrl: baseUrl || 'https://api.placeholder.com', // Safe placeholder to satisfy SDK typing when undefined in tests
});

export default function RootLayout() {
  return (
    <ReactMedplumProvider medplum={medplum}>
        <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="patient" options={{ title: 'Paciente' }} />
        </Stack>
    </ReactMedplumProvider>
  );
}
