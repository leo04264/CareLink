// DTOs for /family (spec §5.2) and /elders (spec §5.3).

import type { FamilyMemberRole } from './enums';

export type ISODate = string;

// ── Summaries used in nested responses ─────────────────────────────────────
export interface MemberSummary {
  userId: string;
  name: string;
  role: FamilyMemberRole;
  joinedAt: ISODate;
}

export interface ElderSummary {
  id: string;
  name: string;
  birthDate: ISODate | null;
  avatarUrl: string | null;
}

export interface FamilyDetail {
  id: string;
  name: string;
  members: MemberSummary[];
  elders: ElderSummary[];
}

// ── POST /family ───────────────────────────────────────────────────────────
export interface CreateFamilyRequest {
  name: string;
}

export interface CreateFamilyResponse {
  id: string;
  name: string;
}

// ── GET /family/:familyId ──────────────────────────────────────────────────
export type GetFamilyResponse = FamilyDetail;

// ── POST /family/:familyId/invite ──────────────────────────────────────────
export interface CreateInviteResponse {
  inviteToken: string;
  expiresAt: ISODate;
}

// ── POST /family/join ──────────────────────────────────────────────────────
export interface JoinFamilyRequest {
  inviteToken: string;
}

export interface JoinFamilyResponse {
  familyId: string;
  role: FamilyMemberRole;
}

// ── PUT /family/:familyId/members/:userId/role ─────────────────────────────
export interface UpdateMemberRoleRequest {
  role: FamilyMemberRole;
}

// ── DELETE /family/:familyId/members/:userId — no body/data ────────────────

// ── POST /family/:familyId/elders ──────────────────────────────────────────
export interface CreateElderRequest {
  name: string;
  birthDate?: ISODate;
}

// ── GET /elders/:elderId ───────────────────────────────────────────────────
// ── PUT /elders/:elderId ───────────────────────────────────────────────────
export type GetElderResponse = ElderSummary;

export interface UpdateElderRequest {
  name?: string;
  birthDate?: ISODate | null;
  avatarUrl?: string | null;
}

export type UpdateElderResponse = ElderSummary;

// ── PUT /elders/:elderId/push-token ────────────────────────────────────────
export interface UpdatePushTokenRequest {
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
}

// ── GET /elders/:elderId/status ────────────────────────────────────────────
// Dashboard summary. Fields populated as later modules (checkin, medication,
// vitals, appointment) come online. Until then: nulls / zero.
export interface ElderStatusResponse {
  checkinToday: {
    checked: boolean;
    checkedAt: ISODate | null;
    streakDays: number;
  };
  medications: {
    total: number;
    completedToday: number;
    nextReminder: string | null; // "HH:MM"
  };
  nextAppointment: {
    id: string;
    department: string;
    scheduledAt: ISODate;
    daysLeft: number;
  } | null;
  lastBP: {
    systolic: number;
    diastolic: number;
    measuredAt: ISODate;
  } | null;
  lastGlucose: {
    value: number;
    context: 'pre' | 'post' | 'bed';
    measuredAt: ISODate;
  } | null;
}
