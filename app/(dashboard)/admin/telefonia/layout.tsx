"use client";

import { Box, Tabs, Title, Text, Container } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function TelefoniaLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Container size="xl" py="xl">
      <Box mb="xl">
        <Title order={2} c="teal.9">Telefonia & Comunicação Unificada</Title>
        <Text c="dimmed">Gerencie dispositivos Cisco e configurações de segurança.</Text>
      </Box>

      <Tabs
        value={pathname}
        onChange={(value) => router.push(value as string)}
        color="teal"
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="/admin/telefonia/hotdesking">Hot Desking (Escritório Compartilhado)</Tabs.Tab>
          <Tabs.Tab value="/admin/telefonia/seguranca">Segurança Premium</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {children}
    </Container>
  );
}
