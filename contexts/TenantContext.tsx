"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TenantInfo {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  color: string;
  plan: string;
  status: 'active' | 'suspended' | 'trial';
  doctorsCount: number;
}

export interface TenantConfig {
  name: string;
  internalColor: string;
  require2FA: boolean;
  activeTenantId?: string;
  activeModules?: {
    agenda: boolean;
    prontuario: boolean;
    faturamento: boolean;
    crm: boolean;
  };
  sidebarModules?: {
    insurance: boolean;
    allergies: boolean;
    problems: boolean;
    vitals: boolean;
  };
}

export const INITIAL_TENANTS: TenantInfo[] = [
  { id: 'tenant-1', name: 'Delchan Health - Unidade Jardins', cnpj: '45.123.456/0001-89', city: 'São Paulo - SP', color: '#0d9488', plan: 'Enterprise SaaS', status: 'active', doctorsCount: 14 },
  { id: 'tenant-2', name: 'Clínica Dermatológica Alpha', cnpj: '12.987.654/0001-32', city: 'Rio de Janeiro - RJ', color: '#3b82f6', plan: 'Profissional', status: 'active', doctorsCount: 6 },
  { id: 'tenant-3', name: 'Centro de Estética & Longevidade', cnpj: '33.444.555/0001-11', city: 'Belo Horizonte - MG', color: '#8b5cf6', plan: 'Starter', status: 'active', doctorsCount: 4 },
  { id: 'tenant-4', name: 'Instituto de Telemedicina BR', cnpj: '98.765.432/0001-90', city: 'Curitiba - PR', color: '#10b981', plan: 'Enterprise SaaS', status: 'trial', doctorsCount: 22 },
];

interface TenantContextType {
  tenantConfig: TenantConfig;
  setTenantConfig: (config: TenantConfig) => void;
  dict: Record<string, string>;
  clinicType: string;
  setClinicType: (type: string) => void;
  toggleMFA: (req: boolean) => void;
  tenants: TenantInfo[];
  switchTenant: (tenantId: string) => void;
  addNewTenant: (tenant: Omit<TenantInfo, 'id'>) => void;
  toggleModule: (moduleKey: 'agenda' | 'prontuario' | 'faturamento' | 'crm') => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [clinicType, setClinicType] = useState('medical');
  const [tenants, setTenants] = useState<TenantInfo[]>(INITIAL_TENANTS);

  const [tenantConfig, setTenantConfigState] = useState<TenantConfig>({
    name: 'Delchan Health OS',
    internalColor: '#0d9488',
    require2FA: false,
    activeTenantId: 'tenant-1',
    activeModules: {
      agenda: true,
      prontuario: true,
      faturamento: true,
      crm: true,
    },
    sidebarModules: {
      insurance: true,
      allergies: true,
      problems: true,
      vitals: true,
    },
  });

  // Carrega configurações persistidas do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('delchan_tenant_config');
      if (savedConfig) {
        setTenantConfigState(JSON.parse(savedConfig));
      }
      const savedTenants = localStorage.getItem('delchan_tenants_list');
      if (savedTenants) {
        setTenants(JSON.parse(savedTenants));
      }
    } catch (e) {
      console.error('Erro ao restaurar configurações salvas:', e);
    }
  }, []);

  const setTenantConfig = (config: TenantConfig) => {
    setTenantConfigState(config);
    try {
      localStorage.setItem('delchan_tenant_config', JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao persistir configurações:', e);
    }
  };

  const switchTenant = (tenantId: string) => {
    const selected = tenants.find((t) => t.id === tenantId);
    if (selected) {
      const updatedConfig: TenantConfig = {
        ...tenantConfig,
        name: selected.name,
        internalColor: selected.color,
        activeTenantId: selected.id,
      };
      setTenantConfig(updatedConfig);
    }
  };

  const addNewTenant = (newT: Omit<TenantInfo, 'id'>) => {
    const created: TenantInfo = {
      ...newT,
      id: `tenant-${Date.now()}`,
    };
    const updated = [created, ...tenants];
    setTenants(updated);
    try {
      localStorage.setItem('delchan_tenants_list', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleModule = (moduleKey: 'agenda' | 'prontuario' | 'faturamento' | 'crm') => {
    const current = tenantConfig.activeModules || { agenda: true, prontuario: true, faturamento: true, crm: true };
    const updated = {
      ...tenantConfig,
      activeModules: {
        ...current,
        [moduleKey]: !current[moduleKey],
      },
    };
    setTenantConfig(updated);
  };

  const toggleMFA = (req: boolean) => {
    setTenantConfig({ ...tenantConfig, require2FA: req });
  };

  const dict = {
    patient: clinicType === 'medical' ? 'Paciente' : 'Cliente',
    chart: clinicType === 'medical' ? 'Prontuário' : 'Ficha',
    doctor: clinicType === 'medical' ? 'Médico' : 'Profissional',
    prescription: clinicType === 'medical' ? 'Receituário' : 'Recomendação',
    room: clinicType === 'medical' ? 'Consultório' : 'Cabine',
  };

  return (
    <TenantContext.Provider
      value={{
        tenantConfig,
        setTenantConfig,
        dict,
        clinicType,
        setClinicType,
        toggleMFA,
        tenants,
        switchTenant,
        addNewTenant,
        toggleModule,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};