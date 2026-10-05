import { Badge, BadgeProps } from '@mantine/core';
import React from 'react';

export type StatusSemanticType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';

export interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
  status: StatusSemanticType;
  children: React.ReactNode;
}

const statusColorMap: Record<StatusSemanticType, string> = {
  success: 'delchanSuccess',
  warning: 'delchanWarning',
  error: 'delchanError',
  info: 'delchanInfo',
  neutral: 'delchanNeutral',
  pending: 'delchanWarning', // Typically represented with warning/amber
};

export function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const color = statusColorMap[status];

  return (
    <Badge color={color} variant="light" {...props}>
      {children}
    </Badge>
  );
}
