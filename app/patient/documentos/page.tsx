"use client";

import { Stack, Title, Card, Text, Group, Box, Badge, ActionIcon, Drawer, UnstyledButton, Button, Alert } from '@mantine/core';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Loading } from '../../../components/ui/Loading';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconFolder, IconX, IconChevronRight, IconFileText, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { DocumentReference } from '@medplum/fhirtypes';
import { useState } from 'react';
import { useMedplum } from '@medplum/react-hooks';

const SUPPORTED_FORMATS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export default function DocumentosPage() {
  const { state, data } = usePatientDashboardContext();
  const medplum = useMedplum();
  const [selectedDocument, setSelectedDocument] = useState<DocumentReference | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (state === 'INITIALIZING' || state === 'LOADING') {
    return <Loading />;
  }

  if (state === 'UNAUTHORIZED' || state === 'FORBIDDEN') {
      return (
          <ErrorState
             title="Acesso Negado"
             message="Sua sessão expirou ou você não tem permissão para acessar este portal."
          />
      );
  }

  if (state === 'ERROR') {
      return (
          <ErrorState />
      );
  }

  const allDocuments = data?.documents || [];
  const hasDocuments = allDocuments.length > 0;

  // Sorting: Descending date. Missing dates go to the end.
  const sortedDocuments = [...allDocuments].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (a.date && !b.date) {
      return -1;
    } else if (!a.date && b.date) {
      return 1;
    }
    // Tie breaker
    return (a.id || '').localeCompare(b.id || '');
  });

  const handleKeyDown = (e: React.KeyboardEvent, doc: DocumentReference) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedDocument(doc);
      setDownloadError(null);
    }
  };

  const parseDocumentDetails = (doc: DocumentReference) => {
      let title = undefined;
      if (doc.type?.text) {
          title = doc.type.text;
      } else if (doc.type?.coding?.[0]?.display) {
          title = doc.type.coding[0].display;
      } else if (doc.description) {
          title = doc.description;
      }

      const dateStr = doc.date;
      const dateObj = dateStr ? new Date(dateStr) : null;
      const description = doc.description !== title ? doc.description : undefined;

      const attachment = doc.content?.[0]?.attachment;
      const format = attachment?.contentType;
      const url = attachment?.url;

      return { title, dateObj, description, format, url, rawStatus: doc.status };
  };

  const getFormatLabel = (format?: string) => {
      if (!format) return undefined;
      if (format.includes('pdf')) return 'PDF';
      if (format.includes('image')) return 'Imagem';
      return format.split('/')[1]?.toUpperCase() || format;
  };

  const handleDownload = async (doc: DocumentReference) => {
      const details = parseDocumentDetails(doc);
      if (!details.url || !details.url.startsWith('Binary/')) {
          setDownloadError("Não é possível acessar o arquivo original.");
          return;
      }

      const binaryId = details.url.split('/')[1];
      const token = medplum.getAccessToken();

      if (!token) {
          setDownloadError("Sessão inválida para download.");
          return;
      }

      setIsDownloading(true);
      setDownloadError(null);

      try {
          const response = await fetch(`/api/patient/binary/${binaryId}`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) {
              throw new Error("Falha ao baixar documento.");
          }

          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = details.title ? `${details.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${details.format?.split('/')[1] || 'bin'}` : `documento_${binaryId}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(objectUrl);

      } catch (err: any) {
          setDownloadError("Não foi possível carregar o documento no momento.");
      } finally {
          setIsDownloading(false);
      }
  };

  const renderDrawerContent = () => {
    if (!selectedDocument) return null;
    const details = parseDocumentDetails(selectedDocument);
    const formatLabel = getFormatLabel(details.format);
    const isSupported = details.format && SUPPORTED_FORMATS.includes(details.format);

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <Box>
                    {formatLabel && (
                        <Badge color="gray" variant="light" mb="xs">
                            {formatLabel}
                        </Badge>
                    )}
                    {details.title && <Title order={4}>{details.title}</Title>}
                    {details.dateObj && (
                        <Text size="sm" c="dimmed" mt={4}>
                            {details.dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </Text>
                    )}
                </Box>
                <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedDocument(null)} aria-label="Fechar detalhes">
                    <IconX size={20} />
                </ActionIcon>
            </Group>

            {details.description && (
                <Box mt="md">
                    <Text size="sm" fw={600} c="dark.7">Descrição</Text>
                    <Text size="sm" mt={4}>{details.description}</Text>
                </Box>
            )}

            {details.rawStatus && (
                 <Box mt="sm">
                    <Text size="sm" fw={600} c="dark.7">Status</Text>
                    <Text size="sm" mt={4}>{details.rawStatus}</Text>
                </Box>
            )}

            <Box mt="xl">
                {isSupported ? (
                    <Stack gap="sm">
                        <Button
                            fullWidth
                            color="delchanPrimary"
                            leftSection={<IconDownload size={18} />}
                            loading={isDownloading}
                            onClick={() => handleDownload(selectedDocument)}
                        >
                            Visualizar documento
                        </Button>
                        {downloadError && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" p="xs">
                                <Text size="xs">{downloadError}</Text>
                            </Alert>
                        )}
                    </Stack>
                ) : (
                    <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                        <Text size="sm">O formato <b>{details.format}</b> não é suportado para visualização no momento.</Text>
                    </Alert>
                )}
            </Box>

        </Stack>
    );
  };

  return (
    <Stack gap="lg" pb="xl">
      <Title order={2} c="dark.9" fw={800} style={{ letterSpacing: '-0.5px' }}>
        Documentos do Paciente
      </Title>

      {!hasDocuments ? (
        <EmptyState
          icon={<IconFolder size={48} stroke={1.5} color="var(--mantine-color-teal-6)" />}
          title="Nenhum documento disponível"
          description="Você ainda não possui documentos associados ao seu perfil."
        />
      ) : (
        <Stack gap="sm">
             {sortedDocuments.map((doc) => {
                const details = parseDocumentDetails(doc);
                const formatLabel = getFormatLabel(details.format);

                return (
                    <Card key={doc.id} p={0} radius="md" withBorder>
                       <UnstyledButton
                         w="100%"
                         p="md"
                         onClick={() => {
                             setSelectedDocument(doc);
                             setDownloadError(null);
                         }}
                         onKeyDown={(ev) => handleKeyDown(ev, doc)}
                         aria-label={details.title ? `Ver detalhes de ${details.title}` : `Ver detalhes do documento`}
                         style={{
                            transition: 'background-color 150ms ease',
                         }}
                       >
                           <Group justify="space-between" wrap="nowrap" align="center">
                               <Group wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                                    <Box mt={2}>
                                        <IconFileText size={24} color="var(--mantine-color-teal-6)" stroke={1.5} />
                                    </Box>
                                    <Box style={{ flex: 1, minWidth: 0 }}>
                                        <Group gap="xs" mb={4}>
                                            {formatLabel && (
                                                <Badge size="sm" color="gray" variant="light">
                                                    {formatLabel}
                                                </Badge>
                                            )}
                                            {details.dateObj && (
                                                <Text size="xs" c="dimmed">
                                                    {details.dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </Text>
                                            )}
                                        </Group>
                                        {details.title && <Text size="sm" fw={600} truncate>{details.title}</Text>}
                                        {details.description && (
                                            <Text size="xs" c="dimmed" truncate mt={4}>{details.description}</Text>
                                        )}
                                    </Box>
                               </Group>
                               <IconChevronRight size={20} color="var(--mantine-color-gray-4)" stroke={1.5} />
                           </Group>
                       </UnstyledButton>
                    </Card>
                );
             })}
          </Stack>
      )}

      <Drawer
        opened={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        position="right"
        size="md"
        withCloseButton={false}
        padding="xl"
      >
        {renderDrawerContent()}
      </Drawer>
    </Stack>
  );
}
