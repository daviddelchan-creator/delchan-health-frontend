"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Title, Text, Button, Group, Stack, Badge, Modal, TextInput, Select,
  Textarea, SimpleGrid, Paper, ActionIcon, Loader, Center, Image, Box,
  Divider, rem, ThemeIcon
} from '@mantine/core';
import {
  IconFlask, IconPhoto, IconFileText, IconUpload, IconPrinter,
  IconDownload, IconEye, IconPlus, IconCheck, IconTrash, IconFile
} from '@tabler/icons-react';
import { Patient, DiagnosticReport, DocumentReference, Attachment } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { QRCodeSVG } from 'qrcode.react';
import { useTenant } from '../../contexts/TenantContext';

interface ExamsTabProps {
  patient: Patient;
}

interface ExamItem {
  id: string;
  title: string;
  type: 'Exame de Imagem' | 'Laboratorial';
  date: string;
  conclusion: string;
  trackingCode?: string;
  attachment?: Attachment;
  binaryId?: string;
  previewUrl?: string;
  rawReport?: DiagnosticReport;
  rawDocRef?: DocumentReference;
}

export function ExamsTab({ patient }: ExamsTabProps) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.internalColor || '#0d9488';
  const tenantId = tenantConfig?.activeTenantId || 'tenant-1';

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [examType, setExamType] = useState<'Exame de Imagem' | 'Laboratorial'>('Exame de Imagem');
  const [examTitle, setExamTitle] = useState('');
  const [examConclusion, setExamConclusion] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().substring(0, 10));
  const [isUploading, setIsUploading] = useState(false);

  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Modal State
  const [printExam, setPrintExam] = useState<ExamItem | null>(null);

  // Load existing exams (DiagnosticReport + DocumentReference)
  const loadExams = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);

    try {
      const [reports, docRefs] = await Promise.all([
        medplum.searchResources('DiagnosticReport', {
          subject: `Patient/${patient.id}`,
          _sort: '-date',
          _count: 50,
        }).catch(() => [] as DiagnosticReport[]),
        medplum.searchResources('DocumentReference', {
          subject: `Patient/${patient.id}`,
          _sort: '-date',
          _count: 50,
        }).catch(() => [] as DocumentReference[]),
      ]);

      const items: ExamItem[] = [];
      const seenBinaryIds = new Set<string>();

      // 1. Processar DiagnosticReports
      for (const rep of reports) {
        const attach = rep.presentedForm?.[0];
        let bId: string | undefined;
        if (attach?.url?.includes('Binary/')) {
          bId = attach.url.split('Binary/')[1];
          seenBinaryIds.add(bId);
        }

        const isImg = rep.category?.some(c => c.coding?.some(cd => cd.code === 'RAD' || cd.code === 'imaging')) ||
          rep.code?.text?.toLowerCase().includes('imagem') ||
          rep.code?.text?.toLowerCase().includes('dermatoscopia') ||
          rep.code?.text?.toLowerCase().includes('foto');

        items.push({
          id: rep.id || Math.random().toString(),
          title: rep.code?.text || 'Exame Clínico',
          type: isImg ? 'Exame de Imagem' : 'Laboratorial',
          date: rep.effectiveDateTime || rep.meta?.lastUpdated || new Date().toISOString(),
          conclusion: rep.conclusion || 'Sem laudo emitido.',
          attachment: attach,
          binaryId: bId,
          rawReport: rep,
        });
      }

      // 2. Processar DocumentReferences de exames (laboratório / imagem)
      for (const doc of docRefs) {
        const attach = doc.content?.[0]?.attachment;
        let bId: string | undefined;
        if (attach?.url?.includes('Binary/')) {
          bId = attach.url.split('Binary/')[1];
          if (seenBinaryIds.has(bId)) {
            continue; // Já adicionado via DiagnosticReport
          }
          seenBinaryIds.add(bId);
        }

        const catCode = doc.category?.[0]?.coding?.[0]?.code;
        const isExam = catCode === 'imaging' || catCode === 'laboratory' ||
          doc.type?.text?.toLowerCase().includes('exame') ||
          doc.type?.text?.toLowerCase().includes('laborat') ||
          doc.type?.text?.toLowerCase().includes('imagem');

        if (isExam || attach) {
          const tracking = doc.identifier?.find(i => i.system === 'urn:med-sistema:doc-tracker')?.value;
          const isImg = catCode === 'imaging' || doc.type?.text?.includes('Imagem') || attach?.contentType?.startsWith('image/');

          items.push({
            id: doc.id || Math.random().toString(),
            title: doc.description?.split(' - ')?.[0] || doc.type?.text || 'Exame Anexado',
            type: isImg ? 'Exame de Imagem' : 'Laboratorial',
            date: doc.date || doc.meta?.lastUpdated || new Date().toISOString(),
            conclusion: doc.description?.split(' - ')?.[1] || 'Documento anexado ao prontuário.',
            trackingCode: tracking,
            attachment: attach,
            binaryId: bId,
            rawDocRef: doc,
          });
        }
      }

      // 3. Carregar previews para imagens que têm binaryId
      for (const it of items) {
        if (it.binaryId && it.attachment?.contentType?.startsWith('image/')) {
          try {
            const bin = await medplum.readResource('Binary', it.binaryId);
            if (bin?.data) {
              it.previewUrl = `data:${it.attachment.contentType};base64,${bin.data}`;
            }
          } catch {
            // Silencioso se der erro no preview individual
          }
        }
      }

      // Ordenar decrescente por data
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExams(items);
    } catch (e) {
      console.error('Erro ao buscar exames:', e);
    } finally {
      setLoading(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Manipulação de Arquivo selecionado
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (!examTitle) {
      setExamTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
      setExamType('Exame de Imagem');
    } else {
      setFilePreview(null);
      if (file.type === 'application/pdf') {
        setExamType('Laboratorial');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Abrir anexo do exame (PDF ou Imagem)
  const handleViewAttachment = async (exam: ExamItem) => {
    if (exam.previewUrl) {
      window.open(exam.previewUrl, '_blank');
      return;
    }

    if (exam.binaryId) {
      try {
        const bin = await medplum.readResource('Binary', exam.binaryId);
        if (bin?.data) {
          const contentType = exam.attachment?.contentType || bin.contentType || 'application/pdf';
          const byteCharacters = atob(bin.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: contentType });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          return;
        }
      } catch (err) {
        console.error('Erro ao ler binary do exame:', err);
      }
    }

    if (exam.attachment?.url) {
      window.open(exam.attachment.url, '_blank');
    }
  };

  // Salvar Novo Exame
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert('Selecione ou arraste um arquivo (Imagem ou PDF) para continuar.');
      return;
    }
    if (!examTitle.trim()) {
      alert('Informe o título / identificação do exame.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload do Arquivo como Binary no Medplum
      const binary = await medplum.createBinary(
        selectedFile,
        selectedFile.name,
        selectedFile.type || 'application/octet-stream'
      );

      const categoryCode = examType === 'Exame de Imagem' ? 'imaging' : 'laboratory';
      const radOrLab = examType === 'Exame de Imagem' ? 'RAD' : 'LAB';
      const trackingCode = `EXAM-${tenantId}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const effectiveIso = new Date(examDate || new Date()).toISOString();

      const attachmentObj: Attachment = {
        contentType: selectedFile.type || 'application/octet-stream',
        url: binary.id ? `Binary/${binary.id}` : binary.url,
        title: selectedFile.name,
        size: selectedFile.size,
      };

      // 2. Criar DiagnosticReport no padrão HL7 FHIR R4
      const reportResource: DiagnosticReport = {
        resourceType: 'DiagnosticReport',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: radOrLab,
                display: examType,
              },
            ],
            text: examType,
          },
        ],
        code: {
          text: examTitle.trim(),
        },
        subject: { reference: `Patient/${patient.id}` },
        effectiveDateTime: effectiveIso,
        conclusion: examConclusion.trim() || 'Resultado e laudo anexados ao prontuário.',
        presentedForm: [attachmentObj],
        identifier: [
          {
            system: 'urn:med-sistema:doc-tracker',
            value: trackingCode,
          },
        ],
        meta: {
          tag: [
            {
              system: 'https://delchan.com/fhir/tenant',
              code: tenantId,
              display: `Tenant ${tenantId}`,
            },
          ],
        },
      };

      await medplum.createResource(reportResource);

      // 3. Criar DocumentReference para indexação e rastreamento completo
      const docRefResource: DocumentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: examType === 'Exame de Imagem' ? '18748-4' : '11502-2',
              display: examType,
            },
          ],
          text: examType,
        },
        category: [
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
                code: categoryCode,
                display: examType,
              },
            ],
          },
        ],
        subject: { reference: `Patient/${patient.id}` },
        date: effectiveIso,
        description: `${examTitle.trim()} - ${examConclusion.trim() || 'Laudo Anexado'}`,
        content: [{ attachment: attachmentObj }],
        identifier: [
          {
            system: 'urn:med-sistema:doc-tracker',
            value: trackingCode,
          },
        ],
        meta: {
          tag: [
            {
              system: 'https://delchan.com/fhir/tenant',
              code: tenantId,
              display: `Tenant ${tenantId}`,
            },
          ],
        },
      };

      await medplum.createResource(docRefResource);

      alert('Exame/Laudo anexado e indexado com sucesso!');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setExamTitle('');
      setExamConclusion('');
      loadExams();
    } catch (err: any) {
      console.error('Erro ao anexar exame:', err);
      alert(`Falha no upload do exame: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* HEADER DA ABA DE EXAMES */}
      <Group justify="space-between">
        <div>
          <Title order={4}>Laudos & Exames Médicos</Title>
          <Text size="xs" c="dimmed">
            Anexe e visualize imagens clínicas, biópsias, laudos de ultrassom e exames de laboratório criptografados.
          </Text>
        </div>
        <Button
          color={primaryColor}
          radius="xl"
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsUploadOpen(true)}
        >
          Anexar Foto ou PDF
        </Button>
      </Group>

      {/* ESTADO DE CARREGAMENTO */}
      {loading && (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <Loader color={primaryColor} size="md" />
            <Text size="xs" c="dimmed">Carregando exames e laudos do prontuário...</Text>
          </Stack>
        </Center>
      )}

      {/* LISTAGEM DE EXAMES */}
      {!loading && exams.length === 0 && (
        <Paper p="xl" radius="md" withBorder bg="#f8fafc" ta="center">
          <ThemeIcon size={48} radius="xl" color="gray" variant="light" mb="sm">
            <IconFlask size={24} />
          </ThemeIcon>
          <Text fw={600} size="sm" c="dark.7">Nenhum exame ou laudo anexado</Text>
          <Text size="xs" c="dimmed" mb="md">
            Clique no botão acima para carregar fotos de procedimentos, exames de sangue ou laudos em PDF.
          </Text>
          <Button
            variant="light"
            color={primaryColor}
            radius="xl"
            size="xs"
            leftSection={<IconUpload size={14} />}
            onClick={() => setIsUploadOpen(true)}
          >
            Fazer Upload Agora
          </Button>
        </Paper>
      )}

      {!loading && exams.length > 0 && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {exams.map((exam) => {
            const isImage = exam.attachment?.contentType?.startsWith('image/') || exam.type === 'Exame de Imagem';
            const tracking = exam.trackingCode || `DOC-${exam.id.substring(0, 8).toUpperCase()}`;

            return (
              <Card key={exam.id} p="md" radius="lg" withBorder shadow="xs" bg="#fcfcfd">
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      color={exam.type === 'Exame de Imagem' ? 'violet' : 'teal'}
                      variant="light"
                      radius="md"
                      size="lg"
                    >
                      {exam.type === 'Exame de Imagem' ? <IconPhoto size={20} /> : <IconFlask size={20} />}
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm" lineClamp={1}>
                        {exam.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(exam.date).toLocaleDateString('pt-BR')} • {exam.type}
                      </Text>
                    </div>
                  </Group>
                  <Badge
                    color={exam.type === 'Exame de Imagem' ? 'violet' : 'teal'}
                    variant="light"
                    size="sm"
                  >
                    Final
                  </Badge>
                </Group>

                {/* PREVIEW DO ARQUIVO */}
                {isImage && exam.previewUrl ? (
                  <Box
                    mb="xs"
                    style={{
                      height: 140,
                      borderRadius: 8,
                      overflow: 'hidden',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image
                      src={exam.previewUrl}
                      alt={exam.title}
                      h={140}
                      w="100%"
                      fit="cover"
                      fallbackSrc="https://placehold.co/400x200?text=Exame+de+Imagem"
                    />
                  </Box>
                ) : (
                  <Paper
                    p="sm"
                    mb="xs"
                    radius="md"
                    bg="#f1f5f9"
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <ThemeIcon color="red" variant="light" size="md" radius="md">
                      <IconFileText size={18} />
                    </ThemeIcon>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={600} truncate>
                        {exam.attachment?.title || `${exam.title}.pdf`}
                      </Text>
                      <Text size="10px" c="dimmed">
                        {exam.attachment?.contentType || 'application/pdf'}
                        {exam.attachment?.size ? ` • ${(exam.attachment.size / 1024).toFixed(1)} KB` : ''}
                      </Text>
                    </div>
                  </Paper>
                )}

                {/* CONCLUSÃO / LAUDO */}
                <Text size="xs" c="dark.7" mb="sm" lineClamp={3}>
                  <Text span fw={600}>Conclusão: </Text>
                  {exam.conclusion}
                </Text>

                <Divider mb="xs" />

                {/* AÇÕES */}
                <Group justify="space-between">
                  <Text size="10px" c="dimmed" ff="monospace">
                    {tracking}
                  </Text>
                  <Group gap="xs">
                    <Button
                      variant="light"
                      color="gray"
                      size="xs"
                      radius="md"
                      leftSection={<IconEye size={14} />}
                      onClick={() => handleViewAttachment(exam)}
                    >
                      Visualizar
                    </Button>
                    <Button
                      variant="subtle"
                      color="teal"
                      size="xs"
                      radius="md"
                      leftSection={<IconPrinter size={14} />}
                      onClick={() => setPrintExam(exam)}
                    >
                      Imprimir QR
                    </Button>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* MODAL DE UPLOAD DE EXAMES */}
      <Modal
        opened={isUploadOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadOpen(false);
            setSelectedFile(null);
            setFilePreview(null);
          }
        }}
        title="Anexar Exame / Laudo Médico"
        centered
        radius="lg"
        size="lg"
      >
        <Stack gap="md">
          {/* ÁREA DE DRAG & DROP */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? primaryColor : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: isDragging ? '#f0fdfa' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            {selectedFile ? (
              <div>
                <ThemeIcon color="teal" size={44} radius="xl" mb="xs">
                  <IconCheck size={24} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="dark.9">
                  {selectedFile.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Arquivo'}
                </Text>
                {filePreview && (
                  <Box mt="sm" style={{ maxHeight: 120, overflow: 'hidden', borderRadius: 8 }}>
                    <Image src={filePreview} alt="Preview" h={120} fit="contain" />
                  </Box>
                )}
                <Text size="xs" c="teal" mt="xs" fw={600}>
                  Clique ou arraste outro arquivo para substituir
                </Text>
              </div>
            ) : (
              <div>
                <ThemeIcon color="gray" size={44} radius="xl" variant="light" mb="xs">
                  <IconUpload size={24} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="dark.9">
                  Arraste o arquivo aqui ou clique para selecionar
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Formatos aceitos: Imagens (PNG, JPG, WEBP) e Documentos em PDF
                </Text>
              </div>
            )}
          </div>

          <Group grow>
            <Select
              label="Tipo de Exame"
              data={[
                { value: 'Exame de Imagem', label: 'Exame de Imagem (Radiologia / Foto)' },
                { value: 'Laboratorial', label: 'Exame Laboratorial (Sangue / Urina / Biópsia)' },
              ]}
              value={examType}
              onChange={(v) => setExamType((v as any) || 'Exame de Imagem')}
              required
            />
            <TextInput
              label="Data de Realização"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </Group>

          <TextInput
            label="Título / Nome do Exame"
            placeholder="Ex: Hemograma Completo com Plaquetas ou Fotodermatoscopia Lesão Cervical"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            required
          />

          <Textarea
            label="Conclusão / Parecer do Laudo"
            placeholder="Descreva os achados diagnósticos, valores de referência ou considerações médicas..."
            rows={4}
            value={examConclusion}
            onChange={(e) => setExamConclusion(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              radius="xl"
              onClick={() => setIsUploadOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              color={primaryColor}
              radius="xl"
              onClick={handleUploadSubmit}
              loading={isUploading}
              leftSection={<IconUpload size={16} />}
            >
              Salvar e Anexar ao Prontuário
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL DE IMPRESSÃO DO LAUDO COM QR CODE */}
      <Modal
        opened={!!printExam}
        onClose={() => setPrintExam(null)}
        title="Visualização e Impressão do Laudo com QR Code"
        centered
        size="lg"
        radius="lg"
      >
        {printExam && (
          <Stack gap="md">
            <Box
              id="printable-exam-report"
              p="xl"
              bg="white"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
              }}
            >
              {/* CABEÇALHO INSTITUCIONAL */}
              <Group justify="space-between" mb="lg" style={{ borderBottom: '2px solid #0d9488', paddingBottom: '12px' }}>
                <div>
                  <Title order={3} c="teal.9">DELCHAN HEALTH OS</Title>
                  <Text size="xs" c="dimmed">Sistema Integrado de Prontuário Eletrônico & Gestão Clínica</Text>
                  <Text size="xs" fw={600} mt={4}>LAUDO DE DIAGNÓSTICO / EXAME MÉDICO</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <QRCodeSVG
                    value={`https://delchan.com/verify/exam/${printExam.trackingCode || printExam.id}`}
                    size={72}
                    level="H"
                  />
                  <Text size="8px" ff="monospace" c="dimmed" mt={2}>
                    {printExam.trackingCode || printExam.id.substring(0, 12)}
                  </Text>
                </div>
              </Group>

              {/* DADOS DO PACIENTE */}
              <SimpleGrid cols={2} spacing="xs" mb="md">
                <Text size="xs"><Text span fw={700}>Paciente: </Text>{patient?.name?.[0]?.given?.join(' ')} {patient?.name?.[0]?.family}</Text>
                <Text size="xs"><Text span fw={700}>Data do Exame: </Text>{new Date(printExam.date).toLocaleDateString('pt-BR')}</Text>
                <Text size="xs"><Text span fw={700}>Data Nasc: </Text>{patient?.birthDate || 'Não informada'}</Text>
                <Text size="xs"><Text span fw={700}>Tipo: </Text>{printExam.type}</Text>
              </SimpleGrid>

              <Divider my="sm" />

              {/* DETALHES DO EXAME */}
              <Title order={4} mb="xs" c="dark.9">{printExam.title}</Title>

              {/* PREVIEW SE FOR IMAGEM */}
              {printExam.previewUrl && (
                <Box my="md" ta="center">
                  <Image
                    src={printExam.previewUrl}
                    alt={printExam.title}
                    mah={300}
                    fit="contain"
                    radius="md"
                  />
                </Box>
              )}

              <Box my="md">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Conclusão / Achados Clínicos:</Text>
                <Paper p="sm" bg="#f8fafc" withBorder radius="md">
                  <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{printExam.conclusion}</Text>
                </Paper>
              </Box>

              <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px dashed #cbd5e1' }}>
                <Text size="xs" c="dimmed">Documento assinado digitalmente no Delchan Health OS.</Text>
                <Text size="xs" fw={600}>Dr(a). Responsável Técnico</Text>
              </Group>
            </Box>

            <Group justify="flex-end">
              <Button variant="default" radius="xl" onClick={() => setPrintExam(null)}>
                Fechar
              </Button>
              <Button
                color={primaryColor}
                radius="xl"
                leftSection={<IconPrinter size={16} />}
                onClick={() => window.print()}
              >
                Imprimir Laudo
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
