import { Drawer, DrawerProps } from '@mantine/core';
import React from 'react';

export interface QuickViewDrawerProps extends DrawerProps {
  children: React.ReactNode;
}

export function QuickViewDrawer({ children, ...props }: QuickViewDrawerProps) {
  return (
    <Drawer position="right" size="md" padding="xl" {...props}>
      {children}
    </Drawer>
  );
}
