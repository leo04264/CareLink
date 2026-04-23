// DTOs for /vitals (spec §5.6).
import type { ISODate } from './family';

export const VitalStatus = {
  NORMAL: 'NORMAL',
  ELEVATED: 'ELEVATED',
  HIGH: 'HIGH',
} as const;
export type VitalStatus = (typeof VitalStatus)[keyof typeof VitalStatus];

// ── Blood pressure ────────────────────────────────────────────────────────
export interface CreateBPRequest {
  systolic: number;
  diastolic: number;
  measuredAt?: ISODate;
}

export interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  measuredAt: ISODate;
}

// ── Blood sugar ───────────────────────────────────────────────────────────
export interface CreateBSRequest {
  glucoseValue: number;
  mealContext?: string;
  measuredAt?: ISODate;
}

export interface BSRecord {
  id: string;
  glucoseValue: number;
  mealContext: string | null;
  measuredAt: ISODate;
}

// ── Summary (spec §5.6 /summary) ──────────────────────────────────────────
export interface VitalsSummary {
  bloodPressure: {
    latest: { systolic: number; diastolic: number; measuredAt: ISODate } | null;
    weeklyAvg: { systolic: number; diastolic: number } | null;
    status: VitalStatus;
  };
  bloodSugar: {
    latest: { value: number; context: string | null; measuredAt: ISODate } | null;
    weeklyAvg: number | null;
    status: VitalStatus;
  };
}
