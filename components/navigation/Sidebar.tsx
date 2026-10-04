import React from 'react';
import { Stack, UnstyledButton, Text, Group, Tooltip, Badge, ActionIcon, ScrollArea } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightCollapse } from '@tabler/icons-react';
import { adminNavigation, doctorNavigation } from '../../lib/navigation';
import { Suspense } from 'react';

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function SidebarContent({ isAdmin, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  // Safe extraction without triggering Suspense boundary errors during prerender globally
  let searchTab: string | null = null;
  try {
     const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
     searchTab = searchParams ? searchParams.get('tab') : null;
  } catch (e) {
     searchTab = null;
  }
  const router = useRouter();

  const navTree = isAdmin ? adminNavigation : doctorNavigation;

  return (
    <Stack justify="space-between" h="100%">
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs" p="sm">
          {navTree.map((group, groupIdx) => (
            <React.Fragment key={groupIdx}>
              {!collapsed && (
                <Text size="xs" fw={700} c="dimmed" mt={groupIdx !== 0 ? 'md' : 0} px="xs" lts={1}>
                  {group.title}
                </Text>
              )}
              {group.items.map((item, itemIdx) => {
                // Determine active state using route or tab matching.
                // This ensures deep-links and page refreshes maintain correct state without local React state locking
                // and avoids window hydration mismatches by utilizing Next.js hooks natively.
                let isActive = false;
                if (item.matchTab) {
                   isActive = searchTab === item.matchTab;
                } else if (item.route === '/doctor') {
                   // Exact match for the root doctor dashboard to prevent it from swallowing all `/doctor/*` routes
                   isActive = pathname === '/doctor';
                } else if (item.route === '/admin') {
                   isActive = pathname === '/admin' && !searchTab;
                } else {
                   isActive = pathname === item.route || pathname?.startsWith(item.route + '/');
                }

                const content = (
                  <UnstyledButton
                    onClick={() => router.push(item.route)}
                    p="sm"
                    bg={isActive ? 'teal.0' : 'transparent'}
                    c={isActive ? 'teal.9' : 'gray.8'}
                    style={{
                      borderRadius: 8,
                      fontWeight: isActive ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      width: '100%'
                    }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Group>
                    {!collapsed && item.badge && (
                      <Badge size="xs" color={item.badge.color || 'teal'} variant="light">{item.badge.label}</Badge>
                    )}
                  </UnstyledButton>
                );

                return collapsed ? (
                  <Tooltip label={item.label} position="right" withArrow key={itemIdx}>
                    {content}
                  </Tooltip>
                ) : (
                  <React.Fragment key={itemIdx}>{content}</React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </Stack>
      </ScrollArea>

      <Group p="md" justify={collapsed ? 'center' : 'flex-end'} style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <Tooltip label={collapsed ? 'Expandir' : 'Recolher'} position="right" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={onToggleCollapse}>
            {collapsed ? <IconLayoutSidebarRightCollapse size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Carregando navegação...</div>}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
