import { useState, useEffect, useCallback } from 'react';
import { Patient, DocumentReference, ClinicalImpression, Communication } from '@medplum/fhirtypes';
import { Box, Card, Text, Badge, Group, Stack, Center, Loader, Divider, Menu, ActionIcon, Button } from '@mantine/core';
import { IconDotsVertical, IconPrinter, IconFileText, IconMessage, IconClock, IconEye } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '../../contexts/TenantContext';

interface PatientTimelineProps {
  patient: Patient;
}

interface TimelineItem {
  id: string;
  type: 'docref' | 'impression' | 'communication';
  title: string;
  date: string;
  rawDate: string;
  htmlContent?: string;
  textContent?: string;
  docRefId?: string;
  trackingCode?: string;
  author?: string;
  rawResource: any;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!patient?.id || !medplum) return;
    setIsLoading(true);
    try {
      // 1. Buscamos DocumentReference (inclui snapshots históricos com Binary)
      const docRefs = await medplum.searchResources('DocumentReference', {
        subject: `Patient/${patient.id}`,
        _sort: '-date',
        _count: 20,
      }).catch(() => []);

      // 2. Buscamos ClinicalImpression (Evoluções SOAP)
      const impressions = await medplum.searchResources('ClinicalImpression', {
        subject: `Patient/${patient.id}`,
        _sort: '-date',
        _count: 20,
      }).catch(() => []);

      // 3. Buscamos Comunicações (Mensagens / WhatsApp / CRM)
      const communications = await medplum.searchResources('Communication', {
        subject: `Patient/${patient.id}`,
        _sort: '-sent',
        _count: 15,
      }).catch(() => []);

      const parsedItems: TimelineItem[] = [];

      // Processar DocumentReferences
      for (const doc of docRefs) {
        const dateStr = doc.date || doc.meta?.lastUpdated || new Date().toISOString();
        const tracking = doc.identifier?.find((i) => i.system === 'urn:med-sistema:doc-tracker')?.value;
        const author = doc.author?.[0]?.display || 'Profissional de Saúde';

        // Tentar buscar conteúdo do Binary anexado se for HTML
        let resolvedHtml: string | undefined = undefined;
        const binaryAttachment = doc.content?.find((c) => c.attachment?.contentType?.includes('html') || c.attachment?.url?.includes('Binary/'));
        if (binaryAttachment?.attachment?.url?.includes('Binary/')) {
          const binaryId = binaryAttachment.attachment.url.split('Binary/')[1];
          try {
            const binary = await medplum.readResource('Binary', binaryId);
            if (binary?.data) {
              resolvedHtml = Buffer.from(binary.data, 'base64').toString('utf8');
            }
          } catch {
            // Silencioso se não conseguir carregar no preview
          }
        }

        parsedItems.push({
          id: doc.id || Math.random().toString(),
          type: 'docref',
          title: doc.type?.text || 'Evolução Clínica Rastreável',
          date: new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          rawDate: dateStr,
          htmlContent: resolvedHtml || doc.description,
          textContent: doc.description,
          docRefId: doc.id,
          trackingCode: tracking,
          author,
          rawResource: doc,
        });
      }

      // Processar ClinicalImpressions
      for (const imp of impressions) {
        // Evitar duplicar se já temos DocumentReference no mesmo minuto
        const impDate = imp.date || imp.meta?.lastUpdated || new Date().toISOString();
        const existsInDocs = parsedItems.some(
          (item) => item.type === 'docref' && Math.abs(new Date(item.rawDate).getTime() - new Date(impDate).getTime()) < 15000
        );

        if (!existsInDocs) {
          parsedItems.push({
            id: imp.id || Math.random().toString(),
            type: 'impression',
            title: 'Evolução Clínica SOAP',
            date: new Date(impDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rawDate: impDate,
            htmlContent: imp.summary,
            author: imp.assessor?.display || 'Médico Responsável',
            rawResource: imp,
          });
        }
      }

      // Processar Communications
      for (const comm of communications) {
        const commDate = comm.sent || comm.meta?.lastUpdated || new Date().toISOString();
        parsedItems.push({
          id: comm.id || Math.random().toString(),
          type: 'communication',
          title: 'Comunicação / Notificação',
          date: new Date(commDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          rawDate: commDate,
          textContent: comm.payload?.[0]?.contentString || 'Comunicação registrada.',
          author: comm.sender?.display || 'Sistema',
          rawResource: comm,
        });
      }

      // Ordenar do mais recente para o mais antigo
      parsedItems.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

      setItems(parsedItems);
    } catch (error) {
      console.error('Erro ao carregar linha do tempo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePrintVersion = (item: TimelineItem) => {
    const url = item.docRefId
      ? `/patient/${patient.id}/print?docRefId=${item.docRefId}&autoPrint=true`
      : `/patient/${patient.id}/print?autoPrint=true`;
    window.open(url, '_blank');
  };

  return (
    <Box p="md">
      {isLoading ? (
        <Center p="xl"><Loader color={tenantConfig.internalColor} /></Center>
      ) : (
        <Stack gap="md">
          {items.length === 0 && (
            <Text c="dimmed" fs="italic" ta="center" py="xl">
              Nenhum registro encontrado na linha do tempo deste paciente.
            </Text>
          )}

          {items.map((item) => {
            const isDocRef = item.type === 'docref';
            const isImpression = item.type === 'impression';

            return (
              <Card key={item.id} p="lg" radius="xl" bg="white" withBorder style={{ borderColor: '#e2e8f0' }}>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Badge
                      color={isDocRef ? 'teal' : isImpression ? 'indigo' : 'blue'}
                      variant="light"
                      size="sm"
                    >
                      {item.title}
                    </Badge>
                    {item.trackingCode && (
                      <Badge size="xs" variant="outline" color="gray">
                        {item.trackingCode}
                      </Badge>
                    )}
                  </Group>

                  <Group gap="xs">
                    <Text size="xs" c="dimmed">{item.date}</Text>

                    {/* MENU DE OPÇÕES (IMPRIMIR ESTA VERSÃO HISTÓRICA) */}
                    <Menu shadow="md" width={220} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Label>Ações do Registro</Menu.Label>
                        <Menu.Item
                          leftSection={<IconPrinter size={14} />}
                          onClick={() => handlePrintVersion(item)}
                        >
                          Imprimir esta versão
                        </Menu.Item>
                        {item.docRefId && (
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => window.open(`/patient/${patient.id}/print?docRefId=${item.docRefId}`, '_blank')}
                          >
                            Visualizar Snapshot
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>

                <Divider my="sm" color="#f1f5f9" />

                {/* CONTEÚDO DO REGISTRO */}
                {item.htmlContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: item.htmlContent }}
                    style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}
                  />
                ) : (
                  <Text size="sm" c="dark.8">
                    {item.textContent || 'Sem detalhes descritos.'}
                  </Text>
                )}

                {item.author && (
                  <Text size="xs" c="dimmed" mt="xs" ta="right">
                    Registrado por: <b>{item.author}</b>
                  </Text>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}