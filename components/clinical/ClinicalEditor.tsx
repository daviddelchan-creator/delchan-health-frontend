"use client";

import { useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextEditor } from '@mantine/tiptap';
import { Button, Group, Paper, Stack, Tooltip } from '@mantine/core';
import { IconQrcode, IconPrinter } from '@tabler/icons-react';
import { FormPrintDialog } from '../FormPrintDialog';

interface ClinicalEditorProps {
  onSave: (contentJson: object, contentHtml: string) => void;
  accentColor?: string;
  loading?: boolean;
  patientId?: string;
  patientName?: string;
}

// SIMULAÇÃO DE MODELOS DINÂMICOS (SOAP, Anamnese, Estética)
const dynamicTemplates = [
  {
    id: 'soap',
    label: '📋 Modelo SOAP',
    content: `
      <h2>Evolução Clínica (SOAP)</h2>
      <h3>S - Subjetivo</h3><p>Queixa principal e histórico relatado...</p>
      <h3>O - Objetivo</h3><p>Exame físico, sinais vitais...</p>
      <h3>A - Avaliação</h3><p>Hipótese diagnóstica / CID-10...</p>
      <h3>P - Plano</h3><p>Conduta e prescrições...</p>
    `
  },
  {
    id: 'anamnese',
    label: '📝 Anamnese Geral',
    content: `
      <h2>Anamnese Inicial</h2>
      <p><strong>HMA:</strong> </p>
      <p><strong>HMP:</strong> </p>
      <p><strong>Alergias conhecidas:</strong> </p>
    `
  },
  {
    id: 'estetica',
    label: '✨ Ficha Estética / Dermato',
    content: `
      <h2>Avaliação Dermatológica</h2>
      <p><strong>Queixa Principal:</strong> </p>
      <p><strong>Biotipo Cutâneo:</strong> [ ] Oleoso [ ] Seco [ ] Misto</p>
      <p><strong>Histórico de Procedimentos:</strong> </p>
    `
  }
];

export function ClinicalEditor({ 
  onSave, 
  accentColor = '#14b8a6', 
  loading = false,
  patientId,
  patientName,
}: ClinicalEditorProps) {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Selecione um modelo acima ou digite a evolução clínica...' }),
    ],
    content: '',
    immediatelyRender: false,
  });

  if (!editor) return null;

  const handleSave = () => {
    onSave(editor.getJSON(), editor.getHTML());
  };

  return (
    <>
      <Paper withBorder radius="md" p="md" bg="white">
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap">
            <Group gap="xs" wrap="wrap">
              {/* RENDERIZADO DINÂMICO DE BOTÕES DE MODELOS */}
              {dynamicTemplates.map((tmpl) => (
                <Button 
                  key={tmpl.id}
                  size="xs" 
                  variant="light" 
                  color="gray" 
                  onClick={() => editor.commands.setContent(tmpl.content)}
                >
                  {tmpl.label}
                </Button>
              ))}

              {/* BOTÃO DE GERAÇÃO DE FICHA COM QR CODE */}
              <Button 
                size="xs" 
                variant="light" 
                color="teal" 
                leftSection={<IconQrcode size={15} />}
                onClick={() => setPrintDialogOpen(true)}
              >
                📄 Ficha SOAP com QR
              </Button>

              <Button size="xs" variant="default" leftSection={<IconPrinter size={14} />} onClick={() => window.print()}>
                Imprimir Tela
              </Button>
            </Group>

            <Button color={accentColor} onClick={handleSave} loading={loading} radius="xl">
              Assinar e Salvar Registro
            </Button>
          </Group>

          <RichTextEditor editor={editor} style={{ minHeight: 400, borderRadius: 8 }}>
            <RichTextEditor.Toolbar sticky stickyOffset={60}>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.ClearFormatting />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <Tooltip label="Imprimir Ficha Clínica Física com QR Code de Rastreamento">
                  <Button 
                    size="compact-xs" 
                    variant="light" 
                    color="teal" 
                    leftSection={<IconQrcode size={14} />}
                    onClick={() => setPrintDialogOpen(true)}
                    style={{ margin: '2px 4px', fontWeight: 600 }}
                  >
                    Ficha com QR
                  </Button>
                </Tooltip>
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>
            <RichTextEditor.Content />
          </RichTextEditor>
        </Stack>
      </Paper>

      {/* DIÁLOGO MANTINE DE IMPRESSÃO COM SELEÇÃO DE PACIENTE (ÓRFÃO PERMITIDO) */}
      <FormPrintDialog
        opened={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        defaultPatientId={patientId}
        defaultPatientName={patientName}
      />
    </>
  );
}