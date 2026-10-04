"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { DelchanAppShell } from '@/components/navigation/DelchanAppShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Root doctor logic acts as the core interface vs Admin sub-paths
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <DelchanAppShell isAdmin={isAdmin}>
      {children}
    </DelchanAppShell>
  );
}