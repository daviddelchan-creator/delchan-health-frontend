"use client";

import { Card, Table, Button, Group, Text, Modal, Stack, TextInput, PasswordInput } from '@mantine/core';
import { useState, useEffect } from 'react';

export default function RamaisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [ramais, setRamais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ user_id: '', extension: '', sip_username: '', sip_password: '', domain: 'delchan.local', tenant_id: 'default' });

  useEffect(() => {
    fetch('/api/cisco/extensions')
      .then(res => res.json())
      .then(data => {
        if (data.extensions) setRamais(data.extensions);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cisco/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setRamais([...ramais, data.extension]);
        setModalOpen(false);
        setFormData({ user_id: '', extension: '', sip_username: '', sip_password: '', domain: 'delchan.local', tenant_id: 'default' });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={700} size="lg">Gestão de Ramais SIP</Text>
        <Button color="teal" onClick={() => setModalOpen(true)}>Novo Ramal</Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Ramal</Table.Th>
            <Table.Th>SIP Username</Table.Th>
            <Table.Th>Domínio</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {ramais.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text c="dimmed" ta="center">Nenhum ramal configurado.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            ramais.map(r => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.extension}</Table.Td>
                <Table.Td>{r.sip_username}</Table.Td>
                <Table.Td>{r.domain}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Criar Novo Ramal SIP" centered>
        <Stack gap="md">
          <TextInput label="ID do Usuário" value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} />
          <TextInput label="Número do Ramal" value={formData.extension} onChange={(e) => setFormData({...formData, extension: e.target.value})} />
          <TextInput label="Usuário SIP" value={formData.sip_username} onChange={(e) => setFormData({...formData, sip_username: e.target.value})} />
          <PasswordInput label="Senha SIP" value={formData.sip_password} onChange={(e) => setFormData({...formData, sip_password: e.target.value})} />
          <TextInput label="Domínio" value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} />
          <Button fullWidth color="teal" onClick={handleCreate} loading={loading}>Salvar Ramal</Button>
        </Stack>
      </Modal>
    </Card>
  );
}
