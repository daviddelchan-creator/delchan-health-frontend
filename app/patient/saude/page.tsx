"use client";

import { Stack, Title } from '@mantine/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconHeartbeat } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';

export default function SaudePlaceholderPage() {
  const { state } = usePatientDashboardContext();
  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN' || state === 'ERROR') {
      return null;
  }
  return (
    <Stack gap="lg">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Minha Saúde
      </Title>
      <EmptyState
        icon={<IconHeartbeat size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
        title="Em breve"
        description="A sincronização com Health Connect e métricas vitais estará disponível em breve."
      />
    </Stack>
  );
}
