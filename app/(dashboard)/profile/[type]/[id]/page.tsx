"use client";

import { useEffect, useState, useCallback } from 'react';
import { useMedplum } from '@medplum/react';
import { ProfileLayout } from '../../../../../components/profile/ProfileLayout';
import { Center, Loader } from '@mantine/core';

export default function ProfilePage({ params }: { params: { type: 'practitioner' | 'patient', id: string } }) {
  const medplum = useMedplum();
  const { type, id } = params;
  const [resourceData, setResourceData] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    try {
      if (type === 'practitioner') {
        const practitioner = await medplum.readResource('Practitioner', id);
        setResourceData({
          name: practitioner.name?.[0]?.text || `${practitioner.name?.[0]?.given?.join(' ')} ${practitioner.name?.[0]?.family}`,
          specialty: 'Especialista Clínico',
          crm: 'CRM / Registro Ativo',
          photo: practitioner.photo?.[0]?.url,
          initials: practitioner.name?.[0]?.given?.[0]?.[0] || 'DR'
        });
      } else {
        const patient = await medplum.readResource('Patient', id);
        setResourceData({
          name: patient.name?.[0]?.text || `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`,
          specialty: 'Paciente / Cliente',
          crm: `ID FHIR: ${id.slice(0, 8)}`,
          photo: patient.photo?.[0]?.url,
          initials: patient.name?.[0]?.given?.[0]?.[0] || 'PA'
        });
      }
    } catch (err) {
      console.error("Erro ao buscar recurso:", err);
    }
  }, [medplum, type, id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!resourceData) return <Center h="100vh"><Loader color="teal" /></Center>;

  return <ProfileLayout type={type} data={resourceData} />;
}