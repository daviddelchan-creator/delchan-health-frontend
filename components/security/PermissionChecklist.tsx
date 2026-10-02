'use client';

import React, { useState } from 'react';

interface Props {
  practitionerRoleId: string;
  initialRole: string;
  initialOverrides: string;
}

export default function PermissionChecklist({ practitionerRoleId, initialRole, initialOverrides }: Props) {
  const [role, setRole] = useState(initialRole);
  const [overrides, setOverrides] = useState<Record<string, any>>(
    initialOverrides ? JSON.parse(initialOverrides) : {}
  );

  const toggleOverride = async (moduleId: string, submoduleId: string, type: 'functions' | 'components', targetId: string) => {
    const updated = { ...overrides };
    if (!updated.modules) updated.modules = {};
    if (!updated.modules[moduleId]) updated.modules[moduleId] = { submodules: {} };
    if (!updated.modules[moduleId].submodules[submoduleId]) updated.modules[moduleId].submodules[submoduleId] = { functions: {}, components: {} };

    const currentVal = updated.modules[moduleId].submodules[submoduleId][type][targetId];
    updated.modules[moduleId].submodules[submoduleId][type][targetId] = currentVal === undefined ? false : !currentVal;

    setOverrides(updated);

    // Stream real, persistent payload modifications back to the Medplum SaaS engine
    await fetch(`/api/admin/permissions/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ practitionerRoleId, role, overrides: JSON.stringify(updated) })
    });
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Hierarquia de Permissões Granulares</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm font-semibold mb-2">Perfil Base (Grupo)</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-zinc-800 p-2 rounded w-full border border-zinc-700 text-white">
            <option value="Podiatrist">Podólogo Sênior</option>
            <option value="Nutritionist">Nutricionista Clínico</option>
            <option value="Administrator">Administrador Geral</option>
          </select>
        </div>

        <div className="mt-4">
          <h4 className="text-md font-semibold text-zinc-300 mb-2">Sobrescritas Individuais (Exceções por Pessoa)</h4>
          <div className="p-4 bg-zinc-950 rounded border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span>Módulo Clínico Podologia -&gt; Excluir Registros</span>
              <button
                onClick={() => toggleOverride('clinical_chart', 'podiatry_notes', 'functions', 'delete_record')}
                className={`px-3 py-1 rounded text-xs font-medium ${overrides?.modules?.clinical_chart?.submodules?.podiatry_notes?.functions?.delete_record === false ? 'bg-red-600' : 'bg-zinc-700'}`}
              >
                {overrides?.modules?.clinical_chart?.submodules?.podiatry_notes?.functions?.delete_record === false ? 'Bloqueado Forçado' : 'Herdado de Perfil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
