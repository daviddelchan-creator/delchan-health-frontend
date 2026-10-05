"use client";

import { Stack, Title } from '@mantine/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';

export default function DocumentosPlaceholderPage() {
  const { state } = usePatientDashboardContext();
  if (state === 'INITIALIZING' || state === 'LOADING' || state === 'UNAUTHORIZED' || state === 'FORBIDDEN' || state === 'ERROR') {
      return null;
  }
  return (
    <Stack gap="lg">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Documentos e Resultados
      </Title>
      <EmptyState
        icon={<span style={{ fontSize: '3rem' }}>📂</span>}
        title="Em breve"
        description="O acesso direto aos laudos, receitas e termos de consentimento estará disponível em breve."
      />
    </Stack>
  );
}
