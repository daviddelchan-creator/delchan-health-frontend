"use client";

import { Stack, Title } from '@mantine/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconUser } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';

export default function PerfilPlaceholderPage() {
  const { state } = usePatientDashboardContext();
  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN' || state === 'ERROR') {
      return null;
  }
  return (
    <Stack gap="lg">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Perfil e Configurações
      </Title>
      <EmptyState
        icon={<IconUser size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
        title="Em breve"
        description="O gerenciamento de conta, privacidade e dependentes estará disponível em breve."
      />
    </Stack>
  );
}
