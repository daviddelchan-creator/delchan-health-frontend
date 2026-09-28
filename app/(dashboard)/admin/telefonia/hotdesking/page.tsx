"use client";

import { useState } from 'react';
import { Card, Table, Button, Modal, Group, Text, Badge, Stack, Box } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';

const DEVICES = [
  { id: '9861-Recepcao', name: '9861-Recepção', model: 'Cisco 9861' },
  { id: '9861-Consultorio1', name: '9861-Consultório 1', model: 'Cisco 9861' },
];

export default function HotDeskingPage() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const handleGenerateQR = (device: any) => {
    setSelectedDevice(device);
    setQrModalOpen(true);
  };

  const handleSimulateScan = async () => {
    if (!selectedDevice) return;

    try {
      const res = await fetch('/api/cisco/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice.id, userId: 'user123' })
      });
      const data = await res.json();

      if (data.session) {
        setActiveSession(`${data.session.doctorName} sentada no ${selectedDevice.name} - Perfil carregado`);
      }
    } catch (e) {
      console.error(e);
    }

    setQrModalOpen(false);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={700} size="lg" mb="md">Dispositivos Cisco (Hot Desking)</Text>

      {activeSession && (
        <Badge color="teal" size="lg" mb="md" variant="light" fullWidth>
          {activeSession}
        </Badge>
      )}

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dispositivo</Table.Th>
            <Table.Th>Modelo</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {DEVICES.map((device) => (
            <Table.Tr key={device.id}>
              <Table.Td>{device.name}</Table.Td>
              <Table.Td>{device.model}</Table.Td>
              <Table.Td>
                <Button variant="light" color="teal" onClick={() => handleGenerateQR(device)}>
                  Gerar QR Code
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={qrModalOpen} onClose={() => setQrModalOpen(false)} title="QR Code - Hot Desking" centered>
        {selectedDevice && (
          <Stack align="center" gap="md">
            <Text>Escaneie com o app para fazer login no {selectedDevice.name}</Text>
            <Box bg="white" p="md" style={{ borderRadius: 8 }}>
                <QRCodeSVG value={`cisco-hotdesk:${selectedDevice.id}`} size={200} />
            </Box>
            <Button fullWidth color="teal" mt="md" onClick={handleSimulateScan}>
              Simulate QR Scan
            </Button>
          </Stack>
        )}
      </Modal>
    </Card>
  );
}
