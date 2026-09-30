'use client';

import { useEffect, useState, useCallback } from 'react';

interface DeviceIndicator {
  id: string;
  name: string;
  type: 'LAPTOP' | 'PHONE';
  position: [number, number, number];
  status: 'SAFE' | 'ALERT';
}

interface AlertPayload {
  deviceId: string;
  reason: string;
  alertPriority: 'HIGH' | 'CRITICAL';
  zoneId: string;
}

export function useSecurityStream(tenantId: string, initialDevices: DeviceIndicator[]) {
  const [devices, setDevices] = useState<DeviceIndicator[]>(initialDevices);
  const [lastAlert, setLastAlert] = useState<AlertPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const connectStream = useCallback(() => {
    if (!tenantId) return;

    setConnectionStatus('connecting');
    // Consumir el endpoint SSE pasando el contexto del inquilino actual
    const eventSource = new EventSource(`/api/inventory/alerts/stream?tenantId=${tenantId}`);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload: AlertPayload = JSON.parse(event.data);
        setLastAlert(payload);

        // Mutar reactivamente el estado del dispositivo comprometido en el mapa para iniciar el parpadeo en rojo
        setDevices((prevDevices) =>
          prevDevices.map((dev) =>
            dev.id === payload.deviceId ? { ...dev, status: 'ALERT' } : dev
          )
        );
      } catch (err) {
        console.error('Error procesando telemetría en tiempo real:', err);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      eventSource.close();
      // Auto-reconexión pasiva tras 5 segundos si el socket de Azure se interrumpe
      setTimeout(connectStream, 5000);
    };

    return eventSource;
  }, [tenantId]);

  useEffect(() => {
    const stream = connectStream();
    return () => {
      if (stream) stream.close();
    };
  }, [connectStream]);

  // Función administrativa para restablecer la alarma manualmente desde la central
  const clearDeviceAlert = (deviceId: string) => {
    setDevices((prevDevices) =>
      prevDevices.map((dev) =>
        dev.id === deviceId ? { ...dev, status: 'SAFE' } : dev
      )
    );
    if (lastAlert?.deviceId === deviceId) {
      setLastAlert(null);
    }
  };

  return { devices, lastAlert, connectionStatus, clearDeviceAlert };
}
