"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useMedplum } from '@medplum/react-hooks';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { Center, Loader } from '@mantine/core';

function ProfilePageContent() {
  const medplum = useMedplum();
  const params = useParams();
  const type = (params?.type as 'practitioner' | 'patient') || 'practitioner';
  const id = (params?.id as string) || '';

  const [resourceData, setResourceData] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      if (type === 'practitioner') {
        const practitioner = await medplum.readResource('Practitioner', id);
        setResourceData({
          name: practitioner.name?.[0]?.text || `${practitioner.name?.[0]?.given?.join(' ') || ''} ${practitioner.name?.[0]?.family || ''}`,
          specialty: 'Especialista Clínico',
          crm: 'CRM / Registro Ativo',
          photo: practitioner.photo?.[0]?.url,
          initials: practitioner.name?.[0]?.given?.[0]?.[0] || 'DR'
        });
      } else {
        const patient = await medplum.readResource('Patient', id);
        setResourceData({
          name: patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`,
          specialty: 'Paciente / Cliente',
          crm: `ID FHIR: ${id.slice(0, 8)}`,
          photo: patient.photo?.[0]?.url,
          initials: patient.name?.[0]?.given?.[0]?.[0] || 'PA'
        });
      }
    } catch (err) {
      console.error("Erro ao buscar recurso:", err);
      // Fallback
      setResourceData({
        name: type === 'practitioner' ? 'Doutor(a) Responsável' : 'Paciente Cadastrado',
        specialty: type === 'practitioner' ? 'Especialista Clínico' : 'Paciente / Cliente',
        crm: `ID: #${id.slice(0, 6)}`,
        initials: type === 'practitioner' ? 'DR' : 'PA'
      });
    }
  }, [medplum, type, id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!resourceData) return <Center h="80vh"><Loader color="teal" /></Center>;

  return <ProfileLayout type={type} data={resourceData} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Center h="80vh"><Loader color="teal" /></Center>}>
      <ProfilePageContent />
    </Suspense>
  );
}