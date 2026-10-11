import { Stack } from 'expo-router';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider as ReactMedplumProvider } from '@medplum/react-hooks';

const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!isDemoMode && !baseUrl) {
    throw new Error('API URL obrigatória. Configure a variável EXPO_PUBLIC_API_URL no ambiente mobile antes de compilar, ou ative EXPO_PUBLIC_DEMO_MODE=true.');
}

const medplum = new MedplumClient({
  baseUrl: isDemoMode ? 'https://demo.internal' : (baseUrl as string),
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
