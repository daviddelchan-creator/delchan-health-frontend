import { Group, Center, Text, Badge, Stack, UnstyledButton } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';

export function GodModeSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <Group mb="xl" px="xs" wrap="nowrap">
        <Center bg="dark.9" c="white" w={32} h={32} style={{ borderRadius: 8, fontWeight: 900 }}>+</Center>
        <div>
          <Text fw={900} size="lg" style={{ letterSpacing: '-0.5px' }} c="dark.9">Delchan</Text>
          <Text size="xs" c="teal.6" fw={700} style={{ marginTop: '-4px' }}>HEALTH OS</Text>
        </div>
        <Badge color="teal" variant="light" size="xs" radius="sm">GOD MODE</Badge>
      </Group>

      <Text size="xs" fw={700} c="dimmed" mb="sm" px="xs" lts={1}>SUPER ADMIN</Text>
      <Stack gap="xs">
        <UnstyledButton onClick={() => router.push('/admin?tab=overview')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 600 }}>Dashboard</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=tenants')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Clínicas / Tenants</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=modules')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Módulos SaaS</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=whitelabel')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>White-Label</UnstyledButton>

        <Text size="xs" fw={700} c="dimmed" mt="sm" mb="xs" px="xs" lts={1}>COMERCIAL & MARKETING</Text>
        <UnstyledButton
          onClick={() => router.push('/admin/crm')}
          p="sm"
          bg={pathname === '/admin/crm' ? 'teal.0' : 'transparent'}
          c={pathname === '/admin/crm' ? 'teal.9' : 'gray.8'}
          style={{
            borderRadius: 8,
            fontWeight: pathname === '/admin/crm' ? 700 : 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>💬 CRM & Leads</span>
          <Badge size="xs" color="teal" variant="light">Ativo</Badge>
        </UnstyledButton>

        <Text size="xs" fw={700} c="dimmed" mt="sm" mb="xs" px="xs" lts={1}>CONFIG. CLÍNICA</Text>
        <UnstyledButton onClick={() => router.push('/admin?tab=clinic')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Dados da Clínica</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=security')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Segurança & Acesso</UnstyledButton>

        <Text size="xs" fw={700} c="dimmed" mt="sm" mb="xs" px="xs" lts={1}>ENGENHARIA</Text>
        <UnstyledButton onClick={() => router.push('/admin?tab=layout')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Layout Prontuário</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=builder')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Construtor de Módulos</UnstyledButton>
        <UnstyledButton onClick={() => router.push('/admin?tab=templates')} p="sm" c="gray.8" style={{ borderRadius: 8, fontWeight: 500 }}>Modelos de Evolução</UnstyledButton>
      </Stack>
    </>
  );
}
