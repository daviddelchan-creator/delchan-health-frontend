import React, { useState } from 'react';
import { Drawer, Box, Button, Group } from '@mantine/core';
import { ConfirmationDialog } from './ConfirmationDialog';

export interface QuickViewDrawerProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isDirty?: boolean;
  primaryActionLoading?: boolean;
}

export function QuickViewDrawer({
  opened,
  onClose,
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  isDirty = false,
  primaryActionLoading = false,
}: QuickViewDrawerProps) {
  const [confirmCloseOpened, setConfirmCloseOpened] = useState(false);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setConfirmCloseOpened(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmCloseOpened(false);
    onClose();
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={handleCloseAttempt}
        title={title}
        data-testid="quick-view-drawer"
        closeOnEscape={true}
        closeOnClickOutside={true}
        trapFocus={true}
        aria-label={title}
        styles={{
          body: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }
        }}
      >
        <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
          {children}
        </Box>

        {(primaryActionLabel || secondaryActionLabel) && (
          <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            {secondaryActionLabel && (
              <Button variant="default" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
            {primaryActionLabel && (
              <Button onClick={onPrimaryAction} loading={primaryActionLoading}>
                {primaryActionLabel}
              </Button>
            )}
          </Group>
        )}
      </Drawer>

      <ConfirmationDialog
        opened={confirmCloseOpened}
        onClose={() => setConfirmCloseOpened(false)}
        title="Descartar alterações?"
        description="Você tem alterações não salvas. Se fechar agora, perderá essas alterações."
        confirmLabel="Descartar alterações"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
