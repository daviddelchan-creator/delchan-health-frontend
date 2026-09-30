export interface DeviceTag {
  epc: string;
}

export interface SecurityEvaluationResult {
  allowed: boolean;
  deviceId: string;
  reason?: string;
  alertPriority?: 'HIGH' | 'CRITICAL';
}
