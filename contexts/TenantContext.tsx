"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

interface TenantContextProps {
  clinicType: ClinicType;
  setClinicType: (type: ClinicType) => void;
  dict: Dictionary;
  tenantConfig: TenantConfig;
  setTenantConfig: React.Dispatch<React.SetStateAction<TenantConfig>>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [clinicType, setClinicType] = useState<ClinicType>('medical');
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>({
    name: 'Delchan Health OS',
    internalColor: '#14b8a6', // Teal
    externalColor: '#8B5CF6', // Violet
    cnpj: '',
    address: '',
    googleReserveEnabled: false
  });

  return (
    <TenantContext.Provider value={{ clinicType, setClinicType, dict: dictionaries[clinicType], tenantConfig, setTenantConfig }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};