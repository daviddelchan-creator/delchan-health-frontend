import { Stack, Title, Text, Button, Center } from '@mantine/core';
import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Center p="xl" style={{ textAlign: 'center' }}>
      <Stack align="center" gap="md">
        {icon && (
          <div style={{ color: 'var(--mantine-color-dimmed)' }}>{icon}</div>
        )}
        <Title order={3} size="h4">
          {title}
        </Title>
        {description && (
          <Text c="dimmed" size="sm" maw={400}>
            {description}
          </Text>
        )}
        {actionLabel && onAction && (
          <Button variant="light" mt="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
