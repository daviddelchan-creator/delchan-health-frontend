import React, { useState, useEffect } from 'react';
import { Modal, Text, Group, Button, Stack, Table, TextInput, Badge, Loader, Alert } from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

interface OCRReviewModalProps {
  opened: boolean;
  onClose: () => void;
  documentReferenceId: string | null;
  token: string;
}

export function OCRReviewModal({ opened, onClose, documentReferenceId, token }: OCRReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (opened && documentReferenceId) {
      loadData();
    }
  }, [opened, documentReferenceId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get Status
      const statRes = await fetch(`/api/patient/documents/${documentReferenceId}/processing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statData = await statRes.json();
      setStatus(statData.status);

      if (statData.status === 'REVIEW_PENDING' || statData.status === 'REVIEWED') {
         // Get Extraction
         const extRes = await fetch(`/api/patient/documents/${documentReferenceId}/extraction`, {
            headers: { Authorization: `Bearer ${token}` }
         });
         const extData = await extRes.json();
         if (extData.fields) {
             if (extData.HUMAN_REVIEW && extData.HUMAN_REVIEW.fields) {
                 setFields(extData.HUMAN_REVIEW.fields);
             } else if (extData.AUTOMATED_EXTRACTION && extData.AUTOMATED_EXTRACTION.fields) {
                 setFields(extData.AUTOMATED_EXTRACTION.fields);
             } else if (extData.fields) {
                 setFields(extData.fields);
             }
         }
      } else {
         setError('Este documento ainda não possui dados extraídos ou falhou no processamento.');
      }
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar dados do documento');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, newValue: string) => {
      const newFields = [...fields];
      newFields[index].humanReviewedValue = newValue;
      newFields[index].reviewAction = 'correction';
      setFields(newFields);
  };

  const saveReview = async () => {
      try {
          const res = await fetch(`/api/patient/documents/${documentReferenceId}/review`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fields })
          });
          if (!res.ok) throw new Error('Falha ao salvar');
          onClose();
      } catch (e: any) {
          setError(e.message);
      }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Revisão de Documento (OCR)" size="xl" centered>
        {loading ? (
            <Group justify="center" p="xl"><Loader /></Group>
        ) : error ? (
            <Alert color="red" title="Atenção" icon={<IconAlertCircle />}>{error}</Alert>
        ) : (
            <Stack>
                <Group justify="space-between">
                    <Text fw={600}>Campos Extraídos Automaticamente</Text>
                    <Badge color={status === 'REVIEWED' ? 'green' : 'yellow'}>{status}</Badge>
                </Group>
                <Text size="xs" c="dimmed">Revise os dados antes de aprovar. Os valores originais da máquina serão mantidos no histórico.</Text>

                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Campo</Table.Th>
                            <Table.Th>Valor (OCR)</Table.Th>
                            <Table.Th>Confiança</Table.Th>
                            <Table.Th>Valor Revisado</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {fields.map((f, i) => (
                            <Table.Tr key={i}>
                                <Table.Td><Badge variant="outline">{f.field}</Badge></Table.Td>
                                <Table.Td><Text size="sm">{f.value} {f.unit || ''}</Text></Table.Td>
                                <Table.Td>
                                    <Text size="xs" c={f.confidence > 0.8 ? 'green' : 'red'}>
                                        {f.confidence ? (f.confidence * 100).toFixed(0) + '%' : 'N/A'}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <TextInput
                                        size="xs"
                                        placeholder="Corrigir valor..."
                                        value={f.humanReviewedValue !== undefined ? f.humanReviewedValue : f.value}
                                        onChange={(e) => handleFieldChange(i, e.currentTarget.value)}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>Cancelar</Button>
                    <Button color="teal" onClick={saveReview}>Salvar Revisão</Button>
                </Group>
            </Stack>
        )}
    </Modal>
  );
}
