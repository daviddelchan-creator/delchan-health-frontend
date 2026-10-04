import React from 'react';
import { Stack, Title, Text, ThemeIcon, Button } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Ocorreu um erro',
  description = 'Não foi possível carregar os dados no momento.',
  onRetry
}: ErrorStateProps) {
  return (
    <Stack align="center" justify="center" p="xl" ta="center" data-testid="error-state">
      <ThemeIcon size={64} radius="xl" variant="light" color="red">
        <IconAlertTriangle size={32} />
      </ThemeIcon>
      <Title order={4} mt="sm">{title}</Title>
      <Text c="dimmed" size="sm" maw={400}>{description}</Text>
      {onRetry && (
        <Button mt="md" variant="light" color="red" onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </Stack>
  );
}
