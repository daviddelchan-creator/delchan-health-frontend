'use client';

import React, { useState } from 'react';

interface FeatureToggleProps {
  tenantId: string;
  initialIsEnabled: boolean;
  onToggleConfiguration: (enabled: boolean) => Promise<boolean>;
}

export default function ModuleFeatureToggle({ tenantId, initialIsEnabled, onToggleConfiguration }: FeatureToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialIsEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    const targetState = !isEnabled;

    // Disparar mutación en la capa de persistencia multi-tenant
    const success = await onToggleConfiguration(targetState);
    if (success) {
      setIsEnabled(targetState);
    }
    setIsUpdating(false);
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm font-sans transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              🎛️
            </span>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Seguridad de Hardware Física e ITAM RFID
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md pl-10">
            Habilita el rastreo de dispositivos mediante antenas UHF perimetrales. Cruza la ubicación de laptops y celulares en tiempo real con las credenciales físicas y agendas del personal médico para prevenir robos en salas compartidas o privadas.
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
          } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs pl-10">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Estado del Módulo:</span>
          <span className={`font-semibold ${isEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
            {isEnabled ? '● Activo en este Tenant' : '○ Suspendido'}
          </span>
        </div>
        {isEnabled && (
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
            Suscripción Enterprise Activa
          </span>
        )}
      </div>
    </div>
  );
}
