"use client";

import { useRef, useState, useEffect } from 'react';
import { Card, Text, Button, Group, Divider, ThemeIcon, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconTrash, IconCheck, IconPencil } from '@tabler/icons-react';

interface MasterSignatureProps {
  documentName: string;
  brandColor?: string;
  onSign: () => void;
  onCancel: () => void;
}

export function MasterSignature({ documentName, brandColor = 'teal', onSign, onCancel }: MasterSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSigned(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  return (
    <Card p="xl" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
      <Group mb="md" gap="sm">
        <ThemeIcon color={brandColor} variant="light" size="lg" radius="xl">
          <IconPencil size={18} />
        </ThemeIcon>
        <div>
          <Text fw={800} size="md" c="dark.9">Assinatura Eletrônica em Tela</Text>
          <Text size="xs" c="dimmed">Documento: {documentName}</Text>
        </div>
      </Group>
      
      <Text size="xs" c="dark.7" mb="md" lh={1.6}>
        Eu, na qualidade de paciente / titular dos dados, declaro ciência dos termos e consinto com a coleta e tratamento das minhas informações de saúde em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </Text>

      {/* ÁREA DE ASSINATURA INTERATIVA EM CANVAS */}
      <Box pos="relative" style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fcfcfd' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '180px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        />
        <Group justify="space-between" px="sm" py={4} bg="#f8fafc" style={{ borderTop: '1px solid #e2e8f0' }}>
          <Text size="10px" c="dimmed">Desenhe sua rubrica no espaço acima (Touch / Mouse)</Text>
          <Tooltip label="Limpar assinatura">
            <ActionIcon size="sm" color="red" variant="subtle" onClick={clearSignature}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>

      <Divider my="md" color="#f1f5f9" />

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} radius="xl">Cancelar</Button>
        <Button color={brandColor} onClick={onSign} radius="xl" disabled={!hasSigned} leftSection={<IconCheck size={16} />}>
          Confirmar e Autenticar Assinatura
        </Button>
      </Group>
    </Card>
  );
}