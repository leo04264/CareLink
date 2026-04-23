import type { ISODate } from './family';

export const AppointmentStatus = {
  UPCOMING: 'UPCOMING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export interface AppointmentRecord {
  id: string;
  department: string;
  hospital: string;
  scheduledAt: ISODate;
  note: string | null;
  status: AppointmentStatus;
  remindDays: number[];
  daysLeft: number;
}

export interface CreateAppointmentRequest {
  department: string;
  hospital: string;
  scheduledAt: ISODate;
  note?: string | null;
  remindDays?: number[];
}

export interface UpdateAppointmentRequest {
  department?: string;
  hospital?: string;
  scheduledAt?: ISODate;
  note?: string | null;
  remindDays?: number[];
}

export interface CompleteAppointmentRequest {
  note?: string;
}
