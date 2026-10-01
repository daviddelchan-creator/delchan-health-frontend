import { Stack } from 'expo-router';
import { MedplumProvider, MedplumClient } from '@medplum/core';
import { MedplumProvider as ReactMedplumProvider } from '@medplum/react-hooks';

const medplum = new MedplumClient({
  baseUrl: 'http://localhost:3000', // Update with actual API URL
});

export default function RootLayout() {
  return (
    <ReactMedplumProvider medplum={medplum}>
        <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        </Stack>
    </ReactMedplumProvider>
  );
}
