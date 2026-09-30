import { z } from 'zod';

export const RfidTelemetrySchema = z.object({
  readerId: z.string().min(1, "Reader ID is required"),
  facilityId: z.string().min(1, "Facility/Tenant ID is required"),
  zoneId: z.string().min(1, "Zone/Room ID is required"),
  timestamp: z.string().datetime(),
  detections: z.array(
    z.object({
      epc: z.string().regex(/^[0-9A-Fa-f]+$/, "Invalid EPC format"),
      rssi: z.number(),
      type: z.enum(['DEVICE_TAG', 'STAFF_BADGE', 'BIOMETRIC_PASS']),
    })
  ).min(1, "At least one detection is required"),
});

export type RfidTelemetryPayload = z.infer<typeof RfidTelemetrySchema>;
