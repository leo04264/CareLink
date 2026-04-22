import type {
  AppointmentUrgency,
  BsContext,
  FamilyMemberRole,
  NotificationType,
  ReportStatus,
  VitalSource,
  VitalType,
} from './enums';

export type ISODateString = string; // "2026-04-22T09:12:00.000Z"

// ── Family / Users ────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: ISODateString;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyMemberRole;
  joinedAt: ISODateString;
}

// ── Elder ─────────────────────────────────────────────────────────────────
export interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string; // 媽媽 / 爸爸 / 奶奶 / 爺爺 / 其他
  avatarUrl?: string;
  lastReport: ISODateString | null;
  reportStatus: ReportStatus;
  todaySteps: number;
  medsDoneToday: number;
  medsTotalToday: number;
}

// ── Medication ────────────────────────────────────────────────────────────
export interface MedicationSlot {
  time: string; // "HH:MM"
  meal: string; // "早餐後・500mg"
  on: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dose: string; // "1 顆", "500mg"
  slots: MedicationSlot[];
  note: string;
  color: string; // hex
  active: boolean;
  missedToday?: boolean;
  pauseReason?: string;
}

export interface MedDoseLog {
  id: string;
  medicationId: string;
  at: ISODateString;
  confirmed: boolean;
  photoUrl?: string;
}

// ── Health vitals ─────────────────────────────────────────────────────────
export interface VitalRecord {
  id: string;
  type: VitalType;
  at: ISODateString;
  sys?: number;
  dia?: number;
  bs?: number;
  ctx?: BsContext;
  source: VitalSource;
  note?: string;
}

// ── Appointments ──────────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  title: string;
  date: ISODateString;
  time: string; // "HH:MM"
  hospital: string;
  department: string;
  location: string;
  note: string;
  urgency: AppointmentUrgency;
  done: boolean;
}

// ── Emergency contacts ────────────────────────────────────────────────────
export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  order: number;
  enabled: boolean;
}

// ── Notifications ─────────────────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  at: ISODateString;
  read: boolean;
  urgent?: boolean;
  meta?: Record<string, unknown>;
}
