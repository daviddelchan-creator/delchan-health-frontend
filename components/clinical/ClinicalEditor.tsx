"use client";

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { Button, Group, Paper, Stack } from '@mantine/core';
import '@mantine/tiptap/styles.css';

interface ClinicalEditorProps {
  onSave: (contentJson: object, contentHtml: string) => void;
  accentColor?: string;
  loading?: boolean;
}

export function ClinicalEditor({ onSave, accentColor = '#14b8a6', loading = false }: ClinicalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Descreva a anamnese, evolução clínica ou conduta terapêutica...' }),
    ],
    content: '',
    immediatelyRender: false,
  });

  if (!editor) return null;

  const handleSave = () => {
    const json = editor.getJSON();
    const html = editor.getHTML();
    onSave(json, html);
  };

  const handleInsertTemplate = (type: 'soap' | 'anamnese') => {
    if (type === 'soap') {
      editor.commands.setContent(`
        <h2>Evolução Clínica (SOAP)</h2>
        <h3>S - Subjetivo</h3><p>Queixa principal e histórico relatado pelo paciente...</p>
        <h3>O - Objetivo</h3><p>Exame físico, sinais vitais, resultados de exames...</p>
        <h3>A - Avaliação</h3><p>Hipótese diagnóstica, CID-10 e evolução do quadro...</p>
        <h3>P - Plano</h3><p>Conduta médica, prescrições, atestados e orientações...</p>
      `);
    } else if (type === 'anamnese') {
      editor.commands.setContent(`
        <h2>Anamnese Inicial</h2>
        <p><strong>HMA (História da Moléstia Atual):</strong> </p>
        <p><strong>HMP (História Médica Pregressa):</strong> </p>
        <p><strong>Alergias:</strong> Nenhuma relatada.</p>
        <p><strong>Medicações em Uso:</strong> </p>
      `);
    }
  };

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Button size="xs" variant="light" color="blue" onClick={() => handleInsertTemplate('soap')}>
              📋 Modelo SOAP
            </Button>
            <Button size="xs" variant="light" color="violet" onClick={() => handleInsertTemplate('anamnese')}>
              📝 Anamnese
            </Button>
            <Button size="xs" variant="default" onClick={() => window.print()}>
              🖨️ Imprimir / PDF
            </Button>
          </Group>
          <Button color={accentColor} onClick={handleSave} loading={loading}>
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
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>
      </Stack>
    </Paper>
  );
}