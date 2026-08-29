"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextEditor } from '@mantine/tiptap';
import { Button, Group, Paper, Stack } from '@mantine/core';

interface ClinicalEditorProps {
  onSave: (contentJson: object, contentHtml: string) => void;
  accentColor?: string;
  loading?: boolean;
}

export function ClinicalEditor({ onSave, accentColor = '#14b8a6', loading = false }: ClinicalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Descreva a anamnese, hipótese diagnóstica e conduta terapêutica...' }),
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
        <h3>S - Subjetivo</h3><p>Queixa principal e histórico relatado pelo paciente...</p>
        <h3>O - Objetivo</h3><p>Exame físico, sinais vitais, dados laboratoriais...</p>
        <h3>A - Avaliação</h3><p>Diagnóstico principal / CID-10 e diagnósticos diferenciais...</p>
        <h3>P - Plano</h3><p>Conduta médica, prescrições e orientações gerais...</p>
      `);
    }
  };

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Button size="xs" variant="light" color="gray" onClick={() => handleInsertTemplate('soap')}>
              + Modelo SOAP
            </Button>
            <Button size="xs" variant="light" color="gray" onClick={() => window.print()}>
              🖨️ Imprimir
            </Button>
          </Group>
          <Button color={accentColor} onClick={handleSave} loading={loading}>
            Assinar e Salvar Registro
          </Button>
        </Group>

        <RichTextEditor editor={editor} style={{ minHeight: 280, borderRadius: 8 }}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
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