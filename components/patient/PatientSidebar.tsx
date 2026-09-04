"use client";

import { useState, useEffect, useCallback } from 'react';
import { Stack, Divider, Title, Text, Group, ActionIcon, Avatar, Modal, TextInput, Button, Select, Badge, Loader } from '@mantine/core';
import { Patient, Observation, Coverage, AllergyIntolerance, Condition } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { useTenant } from '@/contexts/TenantContext';
import { getMothersName } from '@/utils/patientUtils';
import { VitalsModal } from '@/components/Vitals/VitalsModal';

interface PatientSidebarProps {
  patient: Patient;
}

export function PatientSidebar({ patient }: PatientSidebarProps) {
  const { tenantConfig } = useTenant();
  const medplum = useMedplum();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vitals, setVitals] = useState<Observation[]>([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [problems, setProblems] = useState<Condition[]>([]);

  // Estados temporales para los formularios de los modales
  const [insuranceData, setInsuranceData] = useState({ provider: '', memberId: '' });
  const [allergyData, setAllergyData] = useState({ substance: '', criticality: '' });
  const [problemData, setProblemData] = useState({ condition: '', date: '' });

  const fullName = patient.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Paciente sem nome';
  const mothersName = getMothersName(patient);
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'N/A';
  const genderMap: Record<string, string> = { male: 'Masculino', female: 'Feminino', other: 'Outro', unknown: 'Não informado' };
  const gender = patient.gender ? genderMap[patient.gender] : 'Não informado';

  // Configuración de visibilidad desde el God Mode
  const modules = tenantConfig.sidebarModules || { insurance: true, allergies: true, problems: true, vitals: true };

  // Carga reactiva de datos clínicos del paciente
  const loadSidebarData = useCallback(async () => {
    if (!patient?.id || !medplum) return;
    setLoadingVitals(true);
    try {
      const [vitalsRes, coverageRes, allergyRes, conditionRes] = await Promise.all([
        medplum.searchResources('Observation', {
          subject: `Patient/${patient.id}`,
          category: 'vital-signs',
          _sort: '-_lastUpdated',
          _count: 10,
        }).catch(() => []),
        medplum.searchResources('Coverage', {
          beneficiary: `Patient/${patient.id}`,
          _sort: '-_lastUpdated',
          _count: 5,
        }).catch(() => []),
        medplum.searchResources('AllergyIntolerance', {
          patient: `Patient/${patient.id}`,
          _sort: '-_lastUpdated',
          _count: 5,
        }).catch(() => []),
        medplum.searchResources('Condition', {
          subject: `Patient/${patient.id}`,
          _sort: '-_lastUpdated',
          _count: 5,
        }).catch(() => []),
      ]);

      if (vitalsRes) setVitals(vitalsRes);
      if (coverageRes) setCoverages(coverageRes);
      if (allergyRes) setAllergies(allergyRes);
      if (conditionRes) setProblems(conditionRes);
    } catch (e) {
      console.error('Erro ao carregar dados do sidebar do paciente:', e);
    } finally {
      setLoadingVitals(false);
    }
  }, [medplum, patient?.id]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  // Funciones de Guardado en Medplum (FHIR)
  const saveInsurance = async () => {
    setIsSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'Coverage',
        status: 'active',
        subscriber: { reference: `Patient/${patient.id}` },
        beneficiary: { reference: `Patient/${patient.id}` },
        payor: [{ display: insuranceData.provider }],
        identifier: [{ value: insuranceData.memberId }]
      });
      alert('Convênio salvo com sucesso!');
      setActiveModal(null);
      loadSidebarData();
    } catch (err) { alert('Erro ao salvar convênio.'); }
    setIsSaving(false);
  };

  const saveAllergy = async () => {
    setIsSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'AllergyIntolerance',
        clinicalStatus: { coding: [{ code: 'active' }] },
        patient: { reference: `Patient/${patient.id}` },
        code: { text: allergyData.substance },
        criticality: allergyData.criticality === 'Alta' ? 'high' : allergyData.criticality === 'Média' ? 'unable-to-assess' : 'low'
      });
      alert('Alergia salva com sucesso!');
      setActiveModal(null);
      loadSidebarData();
    } catch (err) { alert('Erro ao salvar alergia.'); }
    setIsSaving(false);
  };

  const saveProblem = async () => {
    setIsSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'Condition',
        clinicalStatus: { coding: [{ code: 'active' }] },
        subject: { reference: `Patient/${patient.id}` },
        code: { text: problemData.condition },
        recordedDate: problemData.date || new Date().toISOString()
      });
      alert('Problema crônico salvo com sucesso!');
      setActiveModal(null);
      loadSidebarData();
    } catch (err) { alert('Erro ao salvar problema.'); }
    setIsSaving(false);
  };

  return (
    <>
      <Stack gap="md">
        <Group wrap="nowrap" align="flex-start" mb="sm">
          <Avatar color={tenantConfig.internalColor} radius="md" size="xl">{fullName.charAt(0)}</Avatar>
          <div>
            <Title order={4} c="dark.9" fw={800} lh={1.1}>{fullName}</Title>
            <Text size="xs" c="dimmed" mt={4}>ID: {patient.id?.slice(0, 8)}</Text>
          </div>
        </Group>

        <Stack gap="xs" mb="sm">
          <Group gap="xs"><Text size="sm">🎂</Text><Text size="sm" fw={500} c="dark.7">{patient.birthDate || 'Data não registrada'} ({age} anos)</Text></Group>
          <Group gap="xs"><Text size="sm">⚥</Text><Text size="sm" fw={500} c="dark.7">{gender}</Text></Group>
          {mothersName && (
            <Group gap="xs" wrap="nowrap" align="center">
              <Text size="sm">👩</Text>
              <Text size="xs" fw={500} c="dark.7" lineClamp={1}>Mãe: {mothersName}</Text>
            </Group>
          )}
        </Stack>
        
        <Divider color="#e2e8f0" />
        
        {modules.insurance && (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs"><Text size="sm">🛡️</Text><Title order={6} c="dark.9">Convênio / Seguro</Title></Group>
              <ActionIcon variant="subtle" color="blue" onClick={() => setActiveModal('insurance')}>+</ActionIcon>
            </Group>
            {coverages.length > 0 ? (
              <Stack gap={4}>
                {coverages.map((cov) => (
                  <Group key={cov.id} justify="space-between" wrap="nowrap">
                    <Text size="xs" fw={600} c="dark.8">{cov.payor?.[0]?.display || 'Convênio'}</Text>
                    <Badge size="xs" variant="light" color="teal">{cov.identifier?.[0]?.value || 'Ativo'}</Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" pl="lg">Nenhum convênio registrado.</Text>
            )}
            <Divider color="#e2e8f0" mt="md" />
          </div>
        )}

        {modules.allergies && (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs"><Text size="sm">⚠️</Text><Title order={6} c="dark.9">Alergias</Title></Group>
              <ActionIcon variant="subtle" color="blue" onClick={() => setActiveModal('allergy')}>+</ActionIcon>
            </Group>
            {allergies.length > 0 ? (
              <Group gap="xs" wrap="wrap">
                {allergies.map((all) => (
                  <Badge key={all.id} size="sm" color="red" variant="light">
                    {all.code?.text || 'Alergia'}
                  </Badge>
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" pl="lg">Nenhuma alergia registrada.</Text>
            )}
            <Divider color="#e2e8f0" mt="md" />
          </div>
        )}

        {modules.problems && (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs"><Text size="sm">🩺</Text><Title order={6} c="dark.9">Problemas Crônicos</Title></Group>
              <ActionIcon variant="subtle" color="blue" onClick={() => setActiveModal('problem')}>+</ActionIcon>
            </Group>
            {problems.length > 0 ? (
              <Stack gap={4}>
                {problems.map((prob) => (
                  <Group key={prob.id} justify="space-between" wrap="nowrap">
                    <Text size="xs" fw={600} c="dark.8">{prob.code?.text || 'Condição'}</Text>
                    <Badge size="xs" variant="light" color="orange">Ativo</Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" pl="lg">Nenhum problema registrado.</Text>
            )}
            <Divider color="#e2e8f0" mt="md" />
          </div>
        )}

        {modules.vitals && (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs"><Text size="sm">❤️</Text><Title order={6} c="dark.9">Sinais Vitais</Title></Group>
              <ActionIcon variant="subtle" color="blue" onClick={() => setIsVitalsOpen(true)} title="Registrar Sinais Vitais">+</ActionIcon>
            </Group>
            {loadingVitals ? (
              <Loader size="xs" color="teal" />
            ) : vitals.length > 0 ? (
              <Stack gap={4}>
                {vitals.slice(0, 5).map((v) => {
                  const label = v.code?.text || v.code?.coding?.[0]?.display || 'Medição';
                  let valStr = '';
                  if (v.component && v.component.length > 0) {
                    valStr = v.component.map((c) => c.valueQuantity?.value).join('/') + ' mmHg';
                  } else if (v.valueQuantity) {
                    valStr = `${v.valueQuantity.value} ${v.valueQuantity.unit || ''}`;
                  }
                  return (
                    <Group key={v.id} justify="space-between" wrap="nowrap">
                      <Text size="xs" c="dimmed">{label}:</Text>
                      <Badge size="xs" variant="outline" color="dark">{valStr}</Badge>
                    </Group>
                  );
                })}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" pl="lg">Sem medições recentes.</Text>
            )}
          </div>
        )}
      </Stack>

      {/* MODAL SINAIS VITAIS */}
      {patient?.id && (
        <VitalsModal
          opened={isVitalsOpen}
          onClose={() => setIsVitalsOpen(false)}
          patientId={patient.id}
          onSaved={loadSidebarData}
        />
      )}

      {/* MODALES FUNCIONALES CONECTADOS A MEDPLUM */}
      <Modal opened={activeModal === 'insurance'} onClose={() => setActiveModal(null)} title="Adicionar Convênio" centered>
        <TextInput label="Provedor de Saúde" placeholder="Ex: Amil, Unimed..." mb="sm" value={insuranceData.provider} onChange={(e) => setInsuranceData({...insuranceData, provider: e.currentTarget.value})} />
        <TextInput label="Número da Carteirinha" mb="xl" value={insuranceData.memberId} onChange={(e) => setInsuranceData({...insuranceData, memberId: e.currentTarget.value})} />
        <Button fullWidth color="teal" loading={isSaving} onClick={saveInsurance}>Salvar Convênio</Button>
      </Modal>

      <Modal opened={activeModal === 'allergy'} onClose={() => setActiveModal(null)} title="Registrar Alergia" centered>
        <TextInput label="Substância / Medicamento" placeholder="Ex: Penicilina, Amendoim..." mb="sm" value={allergyData.substance} onChange={(e) => setAllergyData({...allergyData, substance: e.currentTarget.value})} />
        <Select label="Criticidade" data={['Baixa', 'Média', 'Alta']} mb="xl" value={allergyData.criticality} onChange={(val) => setAllergyData({...allergyData, criticality: val || ''})} />
        <Button fullWidth color="red" loading={isSaving} onClick={saveAllergy}>Salvar Alergia</Button>
      </Modal>

      <Modal opened={activeModal === 'problem'} onClose={() => setActiveModal(null)} title="Novo Problema Crônico" centered>
        <TextInput label="Condição Clínica (CID-10)" placeholder="Ex: Hipertensão (I10)" mb="sm" value={problemData.condition} onChange={(e) => setProblemData({...problemData, condition: e.currentTarget.value})} />
        <TextInput label="Data do Diagnóstico" type="date" mb="xl" value={problemData.date} onChange={(e) => setProblemData({...problemData, date: e.currentTarget.value})} />
        <Button fullWidth color="orange" loading={isSaving} onClick={saveProblem}>Salvar Problema</Button>
      </Modal>
    </>
  );
}