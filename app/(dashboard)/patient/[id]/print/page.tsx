"use client";

import { useEffect, useState, useRef, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMedplum } from '@medplum/react-hooks';
import { Patient, DocumentReference, Observation, Coverage, AllergyIntolerance, Condition, Binary } from '@medplum/fhirtypes';
import { useTenant } from '@/contexts/TenantContext';
import { ProntuarioPrintView } from '@/components/Print/ProntuarioPrintView';
import { Center, Loader, Button, Group, Box, Text } from '@mantine/core';
import { IconPrinter, IconArrowLeft } from '@tabler/icons-react';

function PrintProntuarioContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const docRefId = searchParams.get('docRefId');
  const autoPrint = searchParams.get('autoPrint') === 'true';

  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  const printRef = useRef<HTMLDivElement>(null);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);
  const [historicalHtml, setHistoricalHtml] = useState<string | null>(null);
  const [historicalDate, setHistoricalDate] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [problems, setProblems] = useState<Condition[]>([]);
  const [vitals, setVitals] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      if (!id || !medplum) return;
      setLoading(true);
      try {
        // 1. Carregar Paciente
        const p = await medplum.readResource('Patient', id).catch(() => null);
        setPatient(p);

        // 2. Carregar dados de resumo (Vitals, Coverage, Allergy, Problem)
        const [covRes, allRes, probRes, vitRes] = await Promise.all([
          medplum.searchResources('Coverage', { beneficiary: `Patient/${id}`, _sort: '-_lastUpdated', _count: 5 }).catch(() => []),
          medplum.searchResources('AllergyIntolerance', { patient: `Patient/${id}`, _sort: '-_lastUpdated', _count: 5 }).catch(() => []),
          medplum.searchResources('Condition', { subject: `Patient/${id}`, _sort: '-_lastUpdated', _count: 5 }).catch(() => []),
          medplum.searchResources('Observation', { subject: `Patient/${id}`, category: 'vital-signs', _sort: '-_lastUpdated', _count: 5 }).catch(() => []),
        ]);

        if (covRes) setCoverages(covRes);
        if (allRes) setAllergies(allRes);
        if (probRes) setProblems(probRes);
        if (vitRes) setVitals(vitRes);

        // 3. Se docRefId foi passado, carregar o snapshot histórico desse DocumentReference
        if (docRefId) {
          const targetDoc = await medplum.readResource('DocumentReference', docRefId).catch(() => null);
          if (targetDoc) {
            setDocRef(targetDoc);
            if (targetDoc.date) {
              setHistoricalDate(new Date(targetDoc.date).toLocaleDateString('pt-BR'));
            }

            // Tentar ler o HTML do Binary associado ou fallback para description / text
            const binaryAttachment = targetDoc.content?.find(c => c.attachment?.url?.includes('Binary/'));
            if (binaryAttachment?.attachment?.url) {
              const binaryId = binaryAttachment.attachment.url.split('Binary/')[1];
              try {
                const binaryData = await medplum.readResource('Binary', binaryId);
                if (binaryData?.data) {
                  const decoded = Buffer.from(binaryData.data, 'base64').toString('utf8');
                  setHistoricalHtml(decoded);
                }
              } catch (bErr) {
                console.warn('Não foi possível ler Binary do snapshot:', bErr);
              }
            }

            if (!historicalHtml) {
              setHistoricalHtml(targetDoc.description || targetDoc.type?.text || '<p>Registro clínico histórico.</p>');
            }
          }
        } else {
          // Se não há docRefId, pegar a última ClinicalImpression ou DocumentReference
          const impressions = await medplum.searchResources('ClinicalImpression', { subject: `Patient/${id}`, _sort: '-date', _count: 1 }).catch(() => []);
          if (impressions && impressions.length > 0) {
            setHistoricalHtml(impressions[0].summary || '<p>Evolução clínica atual.</p>');
            if (impressions[0].date) {
              setHistoricalDate(new Date(impressions[0].date).toLocaleDateString('pt-BR'));
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do prontuário para impressão:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [id, docRefId, medplum]);

  useEffect(() => {
    if (!loading && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, autoPrint]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader color="teal" size="lg" />
      </Center>
    );
  }

  if (!patient) {
    return (
      <Center h="100vh">
        <Text c="red">Paciente não encontrado para impressão.</Text>
      </Center>
    );
  }

  return (
    <Box bg="#f1f5f9" mih="100vh" p="md">
      {/* BARRA DE AÇÃO SUPERIOR (OCULTA NA IMPRESSÃO) */}
      <Box className="no-print" mb="lg">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
          }
        ` }} />
        <Group justify="space-between" bg="white" p="md" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => window.history.back()}>
            Voltar ao Prontuário
          </Button>
          <Button color="teal.9" radius="xl" leftSection={<IconPrinter size={18} />} onClick={() => window.print()}>
            Imprimir Prontuário Agora
          </Button>
        </Group>
      </Box>

      {/* DOCUMENTO RENDERIZADO */}
      <Box bg="white" style={{ maxWidth: 840, margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 8 }}>
        <ProntuarioPrintView
          ref={printRef}
          patient={patient}
          tenantName={tenantConfig?.name || 'Delchan Health OS'}
          printedBy="Médico / Responsável Técnico"
          docRef={docRef}
          historicalHtml={historicalHtml}
          historicalDate={historicalDate}
          coverages={coverages}
          allergies={allergies}
          problems={problems}
          vitals={vitals}
        />
      </Box>
    </Box>
  );
}

export default function PatientPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<Center h="100vh"><Loader color="teal" /></Center>}>
      <PrintProntuarioContent id={resolvedParams.id} />
    </Suspense>
  );
}
