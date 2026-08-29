"use client";

import { ResourceTimeline } from '@medplum/react';
import { Patient } from '@medplum/fhirtypes';
import { Box } from '@mantine/core';

interface PatientTimelineProps {
  patient: Patient;
}

export function PatientTimeline({ patient }: PatientTimelineProps) {
  return (
    <Box p="md">
      <ResourceTimeline 
        resource={patient} 
        // El loadSearch le dice a Medplum qué buscar para armar la línea de tiempo.
        // Aquí puedes incluir Communications (mensajes), ClinicalImpressions, etc.
        loadSearch={(medplum, resource) => 
          medplum.searchResource('Communication', `subject=Patient/${resource.id}`)
        } 
      />
    </Box>
  );
}