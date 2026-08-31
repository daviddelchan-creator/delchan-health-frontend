"use client";

import { Group, Avatar, Text, Stack, UnstyledButton, Box, ThemeIcon, Center } from '@mantine/core';
// CORRECCIÓN CRÍTICA: Importación desde react-hooks
import { useMedplum } from '@medplum/react-hooks'; 
import { useTenant } from '../../contexts/TenantContext';
import { IconFileDescription, IconPill, IconHeartRateMonitor, IconStethoscope, IconFileText, IconChevronRight } from '@tabler/icons-react';

export function PatientSidebar({ patient, activeTab = 'resumo', setActiveTab }: any) {
  const medplum = useMedplum();
  const { tenantConfig } = useTenant();
  
  // Extraemos el color de la clínica o usamos el Teal por defecto
  const primaryColor = tenantConfig?.internalColor || '#0d9488';

  // Procesamiento seguro de datos FHIR
  const fullName = patient?.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Paciente Não Identificado';
  const patientId = patient?.identifier?.[0]?.value || patient?.id?.substring(0, 8) || 'Sem ID';
  const birthDate = patient?.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : '--';

  const menuItems = [
    { id: 'resumo', icon: IconFileDescription, label: 'Visão Geral', desc: 'Resumo clínico e histórico' },
    { id: 'alergias', icon: IconPill, label: 'Alergias', desc: 'Alertas críticos' },
    { id: 'cronicos', icon: IconStethoscope, label: 'Problemas Crônicos', desc: 'CID + Linha do tempo' },
    { id: 'vitais', icon: IconHeartRateMonitor, label: 'Sinais Vitais', desc: 'PA, FC, Temp' },
    { id: 'docs', icon: IconFileText, label: 'Documentos', desc: 'Anexos e laudos' }
  ];

  return (
    <Box w={320} bg="white" style={{ borderRight: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. HEADER DEL PACIENTE (Estética Premium) */}
      <Box p="lg" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fcfcfd' }}>
        <Group wrap="nowrap">
          <Avatar color={primaryColor} radius="xl" size="lg">
            {fullName.charAt(0)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={700} c="dark.9" truncate>{fullName}, {age}a</Text>
            <Text size="xs" c="dimmed" truncate>ID: {patientId} • Convênio Padrão</Text>
          </div>
        </Group>
      </Box>

      {/* 2. MENÚ DE NAVEGACIÓN CLÍNICA */}
      <Stack gap="xs" p="md" style={{ flex: 1, overflowY: 'auto' }}>
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <UnstyledButton
              key={item.id}
              onClick={() => setActiveTab && setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: isActive ? `${primaryColor}10` : 'transparent',
                border: `1px solid ${isActive ? `${primaryColor}30` : 'transparent'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <ThemeIcon 
                variant={isActive ? 'filled' : 'light'} 
                color={isActive ? primaryColor : 'gray'} 
                size="lg" 
                radius="xl"
              >
                <item.icon size={18} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={isActive ? 700 : 500} c={isActive ? primaryColor : 'dark.7'}>
                  {item.label}
                </Text>
                <Text size="xs" c={isActive ? primaryColor : 'dimmed'} style={{ opacity: isActive ? 0.8 : 1 }}>
                  {item.desc}
                </Text>
              </div>
              <IconChevronRight size={16} color={isActive ? primaryColor : '#cbd5e1'} />
            </UnstyledButton>
          )
        })}

        {menuItems.length === 0 && (
          <Center py="xl" style={{ flexDirection: 'column', textAlign: 'center' }}>
            <Text size="xs" c="dimmed">Nenhuma seção ativa</Text>
          </Center>
        )}
      </Stack>
    </Box>
  );
}