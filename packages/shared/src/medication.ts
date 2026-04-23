// DTOs for /medications (spec §5.5).
import type { ISODate } from './family';

export const MedicationFreq = {
  DAILY: 'DAILY',
  EVERY_OTHER: 'EVERY_OTHER',
  WEEKLY: 'WEEKLY',
  AS_NEEDED: 'AS_NEEDED',
} as const;
export type MedicationFreq = (typeof MedicationFreq)[keyof typeof MedicationFreq];

export const MedicationStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DELETED: 'DELETED',
} as const;
export type MedicationStatus = (typeof MedicationStatus)[keyof typeof MedicationStatus];

export interface ScheduleInput {
  time: string; // "HH:MM"
  mealContext?: string | null;
  amountNote?: string | null;
  isEnabled?: boolean;
}

export interface ScheduleRecord {
  id: string;
  time: string;
  mealContext: string | null;
  amountNote: string | null;
  isEnabled: boolean;
}

export interface LogRecord {
  id: string;
  takenAt: ISODate;
  scheduleTime: string | null;
  photoUrl: string | null;
  confirmed: boolean;
}

export interface MedicationDetail {
  id: string;
  name: string;
  dosage: string | null;
  amountPerDose: string | null;
  color: string | null;
  note: string | null;
  frequency: MedicationFreq;
  status: MedicationStatus;
  pauseReason: string | null;
  schedules: ScheduleRecord[];
  todayLogs: LogRecord[];
}

export type MedicationListResponse = MedicationDetail[];

export interface CreateMedicationRequest {
  name: string;
  dosage?: string | null;
  amountPerDose?: string | null;
  color?: string | null;
  note?: string | null;
  frequency?: MedicationFreq;
  schedules?: ScheduleInput[];
}

export interface UpdateMedicationRequest {
  name?: string;
  dosage?: string | null;
  amountPerDose?: string | null;
  color?: string | null;
  note?: string | null;
  frequency?: MedicationFreq;
}

export interface PauseMedicationRequest {
  pause: boolean;
  reason?: string | null;
}

export interface CreateScheduleRequest extends ScheduleInput {}
export interface UpdateScheduleRequest extends Partial<ScheduleInput> {}

export interface CreateLogRequest {
  scheduleTime?: string;
  photoUrl?: string;
}

export interface LogsListQuery {
  date?: string; // YYYY-MM-DD
  from?: ISODate;
  to?: ISODate;
}

export interface MedicationLogListResponse {
  items: (LogRecord & { medicationId: string; medicationName: string })[];
}
