import React from 'react';
import {
  IconLayoutDashboard, IconUsers, IconCalendar, IconMessageCircle,
  IconSettings, IconBuildingHospital, IconStethoscope, IconTemplate,
  IconTool
} from '@tabler/icons-react';

export interface NavigationItem {
  label: string;
  route: string;
  icon: React.ReactNode;
  badge?: { label: string; color?: string };
  matchTab?: string; // specific pattern for matching admin query params
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const doctorNavigation: NavigationGroup[] = [
  {
    title: 'CLÍNICO / OPERAÇÃO',
    items: [
      { label: 'Início', route: '/doctor', icon: <IconLayoutDashboard size={20} /> },
      { label: 'Pacientes', route: '/doctor/pacientes', icon: <IconUsers size={20} /> },
      { label: 'Agenda', route: '/doctor/agenda', icon: <IconCalendar size={20} /> },
    ]
  },
  {
    title: 'NEGÓCIO',
    items: [
      { label: 'CRM', route: '/doctor/crm', icon: <IconMessageCircle size={20} /> },
    ]
  }
];

export const adminNavigation: NavigationGroup[] = [
  {
    title: 'PLATAFORMA',
    items: [
      { label: 'Dashboard', route: '/admin?tab=overview', icon: <IconLayoutDashboard size={20} />, matchTab: 'overview' },
      { label: 'Clínicas / Tenants', route: '/admin?tab=tenants', icon: <IconBuildingHospital size={20} />, matchTab: 'tenants' },
      { label: 'Módulos SaaS', route: '/admin?tab=modules', icon: <IconSettings size={20} />, matchTab: 'modules' },
      { label: 'White-Label', route: '/admin?tab=whitelabel', icon: <IconSettings size={20} />, matchTab: 'whitelabel' },
    ]
  },
  {
    title: 'NEGÓCIO',
    items: [
      {
        label: 'CRM & Leads',
        route: '/admin/crm',
        icon: <IconMessageCircle size={20} />,
        badge: { label: 'Ativo', color: 'teal' }
      },
    ]
  },
  {
    title: 'CONFIG. CLÍNICA',
    items: [
      { label: 'Dados da Clínica', route: '/admin?tab=clinic', icon: <IconBuildingHospital size={20} />, matchTab: 'clinic' },
      { label: 'Segurança & Acesso', route: '/admin?tab=security', icon: <IconSettings size={20} />, matchTab: 'security' },
    ]
  },
  {
    title: 'ENGENHARIA',
    items: [
      { label: 'Layout Prontuário', route: '/admin?tab=layout', icon: <IconStethoscope size={20} />, matchTab: 'layout' },
      { label: 'Construtor de Módulos', route: '/admin?tab=builder', icon: <IconTool size={20} />, matchTab: 'builder' },
      { label: 'Modelos de Evolução', route: '/admin?tab=templates', icon: <IconTemplate size={20} />, matchTab: 'templates' },
    ]
  }
];
