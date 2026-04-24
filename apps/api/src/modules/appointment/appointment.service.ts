import type { AppointmentRecord, AppointmentStatus } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess, assertMember } from '../../lib/membership';
import type { CompleteInput, CreateApptInput, ListApptQuery, UpdateApptInput } from './appointment.schema';

function daysLeft(scheduledAt: Date): number {
  return Math.ceil((scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function toRecord(a: {
  id: string;
  department: string;
  hospital: string;
  scheduledAt: Date;
  note: string | null;
  status: string;
  remindDays: number[];
}): AppointmentRecord {
  return {
    id: a.id,
    department: a.department,
    hospital: a.hospital,
    scheduledAt: a.scheduledAt.toISOString(),
    note: a.note,
    status: a.status as AppointmentStatus,
    remindDays: a.remindDays,
    daysLeft: daysLeft(a.scheduledAt),
  };
}

async function getApptOr404(apptId: string) {
  const a = await prisma.appointment.findUnique({ where: { id: apptId } });
  if (!a) throw new ApiException(ErrorCodes.NOT_FOUND, 'Appointment not found');
  return a;
}

async function assertApptAccess(callerId: string, apptId: string) {
  const a = await getApptOr404(apptId);
  const elder = await prisma.elder.findUniqueOrThrow({
    where: { id: a.elderId },
    select: { familyId: true },
  });
  await assertMember(callerId, elder.familyId);
  return a;
}

export async function listAppointments(callerId: string, elderId: string, q: ListApptQuery): Promise<AppointmentRecord[]> {
  await assertElderAccess(callerId, elderId);
  const rows = await prisma.appointment.findMany({
    where: { elderId, ...(q.status && { status: q.status }) },
    orderBy: { scheduledAt: 'asc' },
  });
  return rows.map(toRecord);
}

export async function createAppointment(callerId: string, elderId: string, input: CreateApptInput) {
  await assertElderAccess(callerId, elderId);
  const scheduledAt = new Date(input.scheduledAt);
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    // 1-minute grace so copy-pasting "now" doesn't bounce
    throw new ApiException(ErrorCodes.APPOINTMENT_PAST, 'scheduledAt is in the past');
  }
  const a = await prisma.appointment.create({
    data: {
      elderId,
      department: input.department,
      hospital: input.hospital,
      scheduledAt,
      note: input.note ?? null,
      remindDays: input.remindDays ?? [1, 7],
    },
  });
  return toRecord(a);
}

export async function updateAppointment(callerId: string, apptId: string, input: UpdateApptInput) {
  const a = await assertApptAccess(callerId, apptId);
  const updated = await prisma.appointment.update({
    where: { id: a.id },
    data: {
      ...(input.department !== undefined && { department: input.department }),
      ...(input.hospital !== undefined && { hospital: input.hospital }),
      ...(input.scheduledAt !== undefined && { scheduledAt: new Date(input.scheduledAt) }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.remindDays !== undefined && { remindDays: input.remindDays }),
    },
  });
  return toRecord(updated);
}

export async function deleteAppointment(callerId: string, apptId: string) {
  const a = await assertApptAccess(callerId, apptId);
  await prisma.appointment.delete({ where: { id: a.id } });
}

export async function completeAppointment(callerId: string, apptId: string, input: CompleteInput) {
  const a = await assertApptAccess(callerId, apptId);
  const updated = await prisma.appointment.update({
    where: { id: a.id },
    data: {
      status: 'COMPLETED',
      ...(input.note !== undefined && { note: input.note }),
    },
  });
  return toRecord(updated);
}

// ── status helper ─────────────────────────────────────────────────────────
export async function getNextAppointmentForElder(elderId: string) {
  const a = await prisma.appointment.findFirst({
    where: { elderId, status: 'UPCOMING', scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: 'asc' },
  });
  if (!a) return null;
  return {
    id: a.id,
    department: a.department,
    scheduledAt: a.scheduledAt.toISOString(),
    daysLeft: daysLeft(a.scheduledAt),
  };
}
