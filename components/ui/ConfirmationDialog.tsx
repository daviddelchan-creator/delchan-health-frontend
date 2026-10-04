import React from 'react';
import { Modal, Text, Button, Group } from '@mantine/core';

export interface ConfirmationDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmationDialog({
  opened,
  onClose,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isDestructive = false,
  loading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      data-testid="confirmation-dialog"
      trapFocus={true}
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
      aria-label={title}
      aria-describedby="confirmation-dialog-description"
    >
      <Text size="sm" mb="lg" id="confirmation-dialog-description">
        {description}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
          data-testid="confirmation-confirm-btn"
        >
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
