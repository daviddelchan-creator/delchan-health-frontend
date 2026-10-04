import React from 'react';
import { Stack, UnstyledButton, Text, Group, Tooltip, ActionIcon, ScrollArea } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightCollapse, IconHome, IconCalendar, IconFolder, IconActivity, IconUser } from '@tabler/icons-react';

interface PatientSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileItemClick: () => void; // Used to auto-close the burger on mobile after navigating
}

const patientNavItems = [
  { label: 'Início', route: '/patient/dashboard', icon: <IconHome size={20} /> },
  { label: 'Consultas', route: '/patient/appointments', icon: <IconCalendar size={20} /> },
  { label: 'Documentos', route: '/patient/documents', icon: <IconFolder size={20} /> },
  { label: 'Minha Saúde', route: '/patient/health', icon: <IconActivity size={20} /> },
  { label: 'Perfil', route: '/patient/profile', icon: <IconUser size={20} /> },
];

export function PatientSidebar({ collapsed, onToggleCollapse, onMobileItemClick }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (route: string) => {
    router.push(route);
    onMobileItemClick();
  };

  return (
    <Stack justify="space-between" h="100%">
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs" p="sm">
          {patientNavItems.map((item, itemIdx) => {
            const isActive = pathname === item.route || pathname?.startsWith(item.route + '/');

            const content = (
              <UnstyledButton
                onClick={() => handleNavigate(item.route)}
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
