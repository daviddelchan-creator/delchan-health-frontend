"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMedplum } from '@medplum/react';

export type ClinicType = 'medical' | 'spa' | 'salon' | 'dental';

interface Dictionary {
  patient: string; doctor: string; chart: string; appointment: string; prescription: string; room: string;
}

const dictionaries: Record<ClinicType, Dictionary> = {
  medical: { patient: 'Paciente', doctor: 'Médico', chart: 'Prontuário', appointment: 'Consulta', prescription: 'Receituário', room: 'Consultório' },
  spa: { patient: 'Cliente', doctor: 'Especialista', chart: 'Ficha de Avaliação', appointment: 'Sessão', prescription: 'Home Care', room: 'Sala de Estética' },
  salon: { patient: 'Cliente', doctor: 'Profissional', chart: 'Histórico Capilar', appointment: 'Atendimento', prescription: 'Cronograma', room: 'Cadeira' },
  dental: { patient: 'Paciente', doctor: 'Dentista', chart: 'Odontograma', appointment: 'Consulta', prescription: 'Receituário', room: 'Cadeira Odontológica' }
};

interface TenantConfig {
  name: string;
  internalColor: string;
  externalColor: string;
  cnpj: string;
  address: string;
  googleReserveEnabled: boolean;
  require2FA: boolean;
}

interface TenantContextProps {
  clinicType: ClinicType;
  setClinicType: (type: ClinicType) => void;
  dict: Dictionary;
  tenantConfig: TenantConfig;
  setTenantConfig: React.Dispatch<React.SetStateAction<TenantConfig>>;
  toggleMFA: (enabled: boolean) => Promise<void>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const medplum = useMedplum();
  const [clinicType, setClinicType] = useState<ClinicType>('medical');
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>({
    name: 'Delchan Health OS',
    internalColor: '#14b8a6', // Teal
    externalColor: '#8B5CF6', // Violet
    cnpj: '',
    address: '',
    googleReserveEnabled: false,
    require2FA: false
  });

  const toggleMFA = async (enabled: boolean) => {
    try {
      // 1. Atualizamos a interface instantaneamente
      setTenantConfig(prev => ({ ...prev, require2FA: enabled }));
      
      // 2. Chamada real à API do Medplum para alterar a segurança do Projeto
      // Descomente estas linhas quando quiser forçar a regra no backend:
      // const project = await medplum.get('Project', 'SEU_PROJECT_ID');
      // await medplum.updateResource({ ...project, strictMode: enabled });
      
      console.log(`[Segurança] Autenticação 2FA definida como: ${enabled}`);
    } catch (error) {
      console.error("Erro ao modificar políticas de segurança", error);
    }
  };

  return (
    <TenantContext.Provider value={{ clinicType, setClinicType, dict: dictionaries[clinicType], tenantConfig, setTenantConfig, toggleMFA }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};