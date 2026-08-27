"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// Estos son los módulos que venderás en tu SaaS
type ModuleType = 'agenda' | 'clinical' | 'billing' | 'crm';

interface TenantContextProps {
  activeModules: ModuleType[];
  toggleModule: (module: ModuleType) => void;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  // Simulamos que el cliente ya tiene el Plan Base (Agenda y Clínica)
  const [activeModules, setActiveModules] = useState<ModuleType[]>(['agenda', 'clinical']);

  const toggleModule = (module: ModuleType) => {
    setActiveModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  return (
    <TenantContext.Provider value={{ activeModules, toggleModule }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantModules() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenantModules deve ser usado dentro de um TenantProvider");
  return context;
}