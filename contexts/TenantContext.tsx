"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. DEFINIMOS LA ESTRUCTURA DE CONFIGURACIÓN DEL SISTEMA
export interface TenantConfig {
  name: string;
  internalColor: string;
  require2FA: boolean;
  // AÑADIMOS LA CONFIGURACIÓN DE LA BARRA LATERAL
  sidebarModules?: {
    insurance: boolean;
    allergies: boolean;
    problems: boolean;
    vitals: boolean;
  };
}

interface TenantContextType {
  tenantConfig: TenantConfig;
  setTenantConfig: (config: TenantConfig) => void;
  dict: Record<string, string>;
  clinicType: string;
  toggleMFA: (req: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  // CONFIGURACIÓN INICIAL DEL TENANT (Clínica)
  const [clinicType, setClinicType] = useState('medical'); // Puede ser 'medical', 'salon', 'spa'
  
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>({
    name: 'Delchan Health OS',
    internalColor: '#14b8a6', // Color primario por defecto (Teal)
    require2FA: false,
    // MÓDULOS DE LA BARRA LATERAL ACTIVOS POR DEFECTO
    sidebarModules: { 
      insurance: true, 
      allergies: true, 
      problems: true, 
      vitals: true 
    }
  });

  // DICCIONARIO DINÁMICO (Cambia las palabras según el tipo de negocio)
  const dict = {
    patient: clinicType === 'medical' ? 'Paciente' : 'Cliente',
    chart: clinicType === 'medical' ? 'Prontuário' : 'Ficha',
    doctor: clinicType === 'medical' ? 'Médico' : 'Profissional',
    prescription: clinicType === 'medical' ? 'Receituário' : 'Recomendação',
  };

  const toggleMFA = (req: boolean) => {
    setTenantConfig({ ...tenantConfig, require2FA: req });
  };

  return (
    <TenantContext.Provider value={{ tenantConfig, setTenantConfig, dict, clinicType, toggleMFA }}>
      {children}
    </TenantContext.Provider>
  );
}

// HOOK PERSONALIZADO PARA USAR EL CONTEXTO EN CUALQUIER PANTALLA
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};