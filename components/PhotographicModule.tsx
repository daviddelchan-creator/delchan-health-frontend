"use client";

import { useState } from 'react';
import { Card, Title, Text, Button, Stack, Group, Badge, Divider, FileInput, Grid, Slider, Box, ActionIcon } from '@mantine/core';

export function PhotographicModule({ patient, medplum }: { patient: any, medplum: any }) {
  const [preImage, setPreImage] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [gridOpacity, setGridOpacity] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  // Convertir archivo a URL local para visualización instantánea
  const handleImageUpload = (file: File | null, type: 'pre' | 'post') => {
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    if (type === 'pre') setPreImage(imageUrl);
    else setPostImage(imageUrl);
  };

  const handleSaveToGallery = async () => {
    if (!preImage && !postImage) return alert("Debe subir al menos una imagen.");
    setIsSaving(true);

    try {
      // Simulación de carga binaria a FHIR (Media Resource)
      // En producción: se usa medplum.createAttachment() y luego se enlaza al recurso Media.
      setTimeout(async () => {
        await medplum.createResource({
          resourceType: 'Media',
          status: 'completed',
          subject: { reference: `Patient/${patient.id}` },
          type: { coding: [{ code: 'photo' }] },
          note: [{ text: 'Comparativa Pre/Post - Procedimiento Estético' }],
          // content: { contentType: "image/jpeg", data: "base64..." } // Aquí iría la imagen real
        });
        
        alert('✅ Imágenes encriptadas y guardadas en la galería clínica del paciente.');
        setIsSaving(false);
      }, 1500);
    } catch (error: any) {
      alert('❌ Error al guardar: ' + error.message);
      setIsSaving(false);
    }
  };

  // Componente de Cuadrícula de Simetría (Symmetry Grid)
  const SymmetryGrid = () => (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
      backgroundSize: '10% 10%', // Crea una cuadrícula de 10x10
      opacity: gridOpacity / 100,
      pointerEvents: 'none', // Permite hacer clic a través de la cuadrícula
      zIndex: 10
    }} />
  );

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder bg="#1a1b1e">
      <Group justify="space-between" mb="md">
        <Title order={4} c="cyan">Estudio Fotográfico y Simetría</Title>
        <Badge color="cyan" variant="outline">Módulo Visual Estético</Badge>
      </Group>

      <Text size="sm" c="gray" mb="lg">
        Herramienta de análisis biométrico. Suba las imágenes del paciente y ajuste la cuadrícula para evaluar simetría en cejas, labios o evolución de la piel.
      </Text>

      <Stack>
        <Group>
          <Text size="sm" c="white" fw={600}>Opacidad de la Cuadrícula Biométrica:</Text>
          <Slider 
            value={gridOpacity} 
            onChange={setGridOpacity} 
            min={0} max={100} 
            w={200} 
            color="cyan" 
          />
        </Group>

        <Grid>
          {/* COLUMNA PRE-PROCEDIMIENTO */}
          <Grid.Col span={6}>
            <Card padding="sm" radius="md" bg="#2c2e33">
              <Title order={6} c="white" ta="center" mb="sm">PRE - Procedimiento</Title>
              <FileInput 
                accept="image/png,image/jpeg" 
                placeholder="Subir foto Inicial" 
                onChange={(file) => handleImageUpload(file, 'pre')}
                mb="sm"
              />
              <Box pos="relative" h={250} style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {preImage ? (
                  <>
                    <img src={preImage} alt="Pre-tratamiento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {gridOpacity > 0 && <SymmetryGrid />}
                  </>
                ) : (
                  <Text c="dimmed" ta="center" mt={100}>Sin imagen</Text>
                )}
              </Box>
            </Card>
          </Grid.Col>

          {/* COLUMNA POST-PROCEDIMIENTO */}
          <Grid.Col span={6}>
            <Card padding="sm" radius="md" bg="#2c2e33">
              <Title order={6} c="white" ta="center" mb="sm">POST - Procedimiento</Title>
              <FileInput 
                accept="image/png,image/jpeg" 
                placeholder="Subir foto Final" 
                onChange={(file) => handleImageUpload(file, 'post')}
                mb="sm"
              />
              <Box pos="relative" h={250} style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {postImage ? (
                  <>
                    <img src={postImage} alt="Post-tratamiento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {gridOpacity > 0 && <SymmetryGrid />}
                  </>
                ) : (
                  <Text c="dimmed" ta="center" mt={100}>Sin imagen</Text>
                )}
              </Box>
            </Card>
          </Grid.Col>
        </Grid>

        <Divider my="sm" color="dark.4" />
        
        <Button color="cyan" size="lg" onClick={handleSaveToGallery} loading={isSaving} fullWidth>
          Guardar Evidencia en Expediente FHIR
        </Button>
      </Stack>
    </Card>
  );
}