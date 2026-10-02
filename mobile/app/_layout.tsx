import { Stack } from 'expo-router';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider as ReactMedplumProvider } from '@medplum/react-hooks';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!baseUrl) {
    throw new Error('API URL obrigatória. Configure a variável EXPO_PUBLIC_API_URL no ambiente mobile antes de compilar.');
}

const medplum = new MedplumClient({
  baseUrl: baseUrl as string,
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
