"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Tipos de negocios que soporta Delchan Health OS
export type ClinicType = 'medical' | 'spa' | 'salon' | 'dental';

// 2. Estructura del diccionario
interface Dictionary {
  patient: string;       // Paciente vs Cliente
  doctor: string;        // Médico vs Especialista vs Cabeleireiro
  chart: string;         // Prontuário vs Ficha
  appointment: string;   // Consulta vs Sessão vs Atendimento
  prescription: string;  // Receita vs Recomendação
  room: string;          // Consultório vs Sala vs Cadeira
}

// 3. Los diccionarios (La magia de la mutación)
const dictionaries: Record<ClinicType, Dictionary> = {
  medical: {
    patient: 'Paciente',
    doctor: 'Médico',
    chart: 'Prontuário',
    appointment: 'Consulta',
    prescription: 'Receituário',
    room: 'Consultório',
  },
  spa: {
    patient: 'Cliente',
    doctor: 'Especialista',
    chart: 'Ficha de Avaliação',
    appointment: 'Sessão',
    prescription: 'Home Care (Recomendação)',
    room: 'Sala de Estética',
  },
  salon: {
    patient: 'Cliente',
    doctor: 'Profissional',
    chart: 'Histórico Capilar',
    appointment: 'Atendimento',
    prescription: 'Cronograma Capilar',
    room: 'Cadeira',
  },
  dental: {
    patient: 'Paciente',
    doctor: 'Dentista',
    chart: 'Odontograma',
    appointment: 'Consulta',
    prescription: 'Receituário',
    room: 'Cadeira Odontológica',
  }
};

// 4. Creamos el contexto
interface TenantContextProps {
  clinicType: ClinicType;
  setClinicType: (type: ClinicType) => void;
  dict: Dictionary;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

// 5. El Proveedor que envolverá toda tu app
export const TenantProvider = ({ children }: { children: ReactNode }) => {
  // Simulamos que por defecto es una Clínica Médica (luego esto vendrá de la base de datos del Admin)
  const [clinicType, setClinicType] = useState<ClinicType>('medical');

  return (
    <TenantContext.Provider value={{ clinicType, setClinicType, dict: dictionaries[clinicType] }}>
      {children}
    </TenantContext.Provider>
  );
};

// 6. Hook personalizado para usar el diccionario fácilmente
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
};