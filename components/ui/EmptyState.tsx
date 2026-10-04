import React from 'react';
import { Stack, Title, Text, ThemeIcon, Button, Group } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" p="xl" ta="center" data-testid="empty-state">
      <ThemeIcon size={64} radius="xl" variant="light" color="gray">
        {icon || <IconInfoCircle size={32} />}
      </ThemeIcon>
      <Title order={4} mt="sm">{title}</Title>
      {description && <Text c="dimmed" size="sm" maw={400}>{description}</Text>}
      {actionLabel && onAction && (
        <Button mt="md" onClick={onAction}>{actionLabel}</Button>
      )}
    </Stack>
  );
}
