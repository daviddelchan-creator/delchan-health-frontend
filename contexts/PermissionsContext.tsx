"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMedplum } from '@medplum/react-hooks';

interface PermissionsContextType {
  permissions: any;
  loading: boolean;
  hasPermission: (path: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: null,
  loading: true,
  hasPermission: () => false,
});

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const medplum = useMedplum();

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = medplum.getAccessToken();
        if (!token) {
           setLoading(false);
           return;
        }

        const res = await fetch('/api/v1/auth/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setPermissions(data.resolvedPermissions);
        }
      } catch (error) {
        console.error("Failed to load permissions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [medplum]);

  const hasPermission = (path: string): boolean => {
    if (!permissions) return false;

    const keys = path.split('.');
    let current = permissions;

    for (const key of keys) {
      if (current === undefined || current === null) return false;
      current = current[key];
    }

    return Boolean(current);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
