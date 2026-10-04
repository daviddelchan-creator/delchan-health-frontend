import React from 'react';
import { Badge, BadgeProps } from '@mantine/core';

type StatusType = 'active' | 'inactive' | 'pending' | 'processing' | 'completed' | 'error' | 'scheduled' | 'cancelled';

interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { color: string; label: string }> = {
  active: { color: 'teal', label: 'Ativo' },
  inactive: { color: 'gray', label: 'Inativo' },
  pending: { color: 'yellow', label: 'Pendente' },
  processing: { color: 'blue', label: 'Processando' },
  completed: { color: 'teal', label: 'Concluído' },
  error: { color: 'red', label: 'Erro' },
  scheduled: { color: 'indigo', label: 'Agendado' },
  cancelled: { color: 'red', label: 'Cancelado' },
};

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge color={config.color} variant="light" data-testid="status-badge" {...props}>
      {config.label}
    </Badge>
  );
}
