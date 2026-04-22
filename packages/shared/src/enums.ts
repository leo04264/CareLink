export const FamilyMemberRole = {
  CAREGIVER: 'CAREGIVER',
  ELDER: 'ELDER',
} as const;
export type FamilyMemberRole = (typeof FamilyMemberRole)[keyof typeof FamilyMemberRole];

export const ReportStatus = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const VitalType = {
  BP: 'bp',
  BS: 'bs',
} as const;
export type VitalType = (typeof VitalType)[keyof typeof VitalType];

export const BsContext = {
  PRE: 'pre',
  POST: 'post',
  BED: 'bed',
} as const;
export type BsContext = (typeof BsContext)[keyof typeof BsContext];

export const AppointmentUrgency = {
  HIGH: 'high',
  MID: 'mid',
  LOW: 'low',
} as const;
export type AppointmentUrgency = (typeof AppointmentUrgency)[keyof typeof AppointmentUrgency];

export const NotificationType = {
  SOS: 'sos',
  MED: 'med',
  HEALTH: 'health',
  OK: 'ok',
  WARN: 'warn',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const MedDoseStatus = {
  DONE: 'done',
  MISSED: 'missed',
  PENDING: 'pending',
  PAUSED: 'paused',
} as const;
export type MedDoseStatus = (typeof MedDoseStatus)[keyof typeof MedDoseStatus];

export const VitalSource = {
  ELDER_MANUAL: 'elder_manual',
  CAREGIVER_MANUAL: 'caregiver_manual',
  DEVICE: 'device',
} as const;
export type VitalSource = (typeof VitalSource)[keyof typeof VitalSource];
