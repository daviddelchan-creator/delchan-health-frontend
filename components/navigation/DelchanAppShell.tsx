import React, { useState } from 'react';
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DelchanAppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function DelchanAppShell({ children, isAdmin = false }: DelchanAppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: collapsed ? 80 : 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      bg="var(--mantine-color-application)"
    >
      <AppShell.Header>
        <Header
          burger={<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
          isAdmin={isAdmin}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
