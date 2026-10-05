import { Stack, Title, Text, Button, Center, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Ocorreu um erro',
  message = 'Não foi possível carregar as informações. Tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  return (
    <Center p="xl">
      <Stack align="center" gap="md" maw={400} w="100%">
        <Alert
          icon={<IconAlertCircle size={24} />}
          title={title}
          color="delchanError"
          variant="light"
          style={{ width: '100%' }}
        >
          <Text size="sm">{message}</Text>
        </Alert>
        {onRetry && (
          <Button variant="outline" color="delchanError" onClick={onRetry} mt="md">
            {retryLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
