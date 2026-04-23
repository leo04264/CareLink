import type { FamilyDetail, FamilyMemberRole, MemberSummary, ElderSummary } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertMember, assertPrimary } from '../../lib/membership';
import { INVITE_TOKEN_TTL_MS, generateInviteToken } from '../../lib/invite';
import type { CreateFamilyInput, JoinFamilyInput, UpdateRoleInput } from './family.schema';

// ── create ────────────────────────────────────────────────────────────────
export async function createFamily(callerId: string, input: CreateFamilyInput) {
  const family = await prisma.family.create({
    data: {
      name: input.name,
      members: { create: { userId: callerId, role: 'PRIMARY' } },
    },
  });
  return { id: family.id, name: family.name };
}

// ── get (detail) ──────────────────────────────────────────────────────────
export async function getFamily(callerId: string, familyId: string): Promise<FamilyDetail> {
  await assertMember(callerId, familyId);
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: { include: { user: { select: { name: true } } } },
      elders: true,
    },
  });
  if (!family) {
    // Unreachable unless the family disappeared between assertMember and here,
    // but keeps the type checker happy.
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Family not found');
  }
  const members: MemberSummary[] = family.members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    role: m.role as FamilyMemberRole,
    joinedAt: m.joinedAt.toISOString(),
  }));
  const elders: ElderSummary[] = family.elders.map((e) => ({
    id: e.id,
    name: e.name,
    birthDate: e.birthDate ? e.birthDate.toISOString() : null,
    avatarUrl: e.avatarUrl ?? null,
  }));
  return { id: family.id, name: family.name, members, elders };
}

// ── invite ────────────────────────────────────────────────────────────────
export async function createInvite(callerId: string, familyId: string) {
  await assertMember(callerId, familyId);
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  await prisma.inviteToken.create({
    data: { token, familyId, createdById: callerId, expiresAt },
  });
  return { inviteToken: token, expiresAt: expiresAt.toISOString() };
}

// ── join ──────────────────────────────────────────────────────────────────
export async function joinFamily(callerId: string, input: JoinFamilyInput) {
  const record = await prisma.inviteToken.findUnique({ where: { token: input.inviteToken } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiException(ErrorCodes.INVITE_INVALID, 'Invite token invalid, used, or expired');
  }
  // If the caller is already a member, treat join as a no-op but still invalidate the token.
  const existing = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: callerId, familyId: record.familyId } },
  });
  if (existing) {
    await prisma.inviteToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return { familyId: existing.familyId, role: existing.role as FamilyMemberRole };
  }
  const [member] = await prisma.$transaction([
    prisma.familyMember.create({
      data: { userId: callerId, familyId: record.familyId, role: 'CAREGIVER' },
    }),
    prisma.inviteToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { familyId: member.familyId, role: member.role as FamilyMemberRole };
}

// Guard: at least one PRIMARY must remain. Used before demoting or removing
// a PRIMARY.
async function ensureOtherPrimaryExists(familyId: string, exceptUserId: string) {
  const count = await prisma.familyMember.count({
    where: { familyId, role: 'PRIMARY', userId: { not: exceptUserId } },
  });
  if (count === 0) {
    throw new ApiException(ErrorCodes.VALIDATION_ERROR, 'A family must keep at least one PRIMARY member');
  }
}

// ── change role ───────────────────────────────────────────────────────────
export async function updateMemberRole(
  callerId: string,
  familyId: string,
  targetUserId: string,
  input: UpdateRoleInput,
) {
  await assertPrimary(callerId, familyId);
  const target = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
  if (!target) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Target member not in this family');
  }
  // If we're demoting the last PRIMARY, block.
  if (target.role === 'PRIMARY' && input.role !== 'PRIMARY') {
    await ensureOtherPrimaryExists(familyId, targetUserId);
  }
  await prisma.familyMember.update({
    where: { userId_familyId: { userId: targetUserId, familyId } },
    data: { role: input.role },
  });
}

// ── remove member ─────────────────────────────────────────────────────────
export async function removeMember(callerId: string, familyId: string, targetUserId: string) {
  await assertPrimary(callerId, familyId);
  if (callerId === targetUserId) {
    throw new ApiException(ErrorCodes.VALIDATION_ERROR, 'PRIMARY cannot remove themselves from the family');
  }
  const target = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
  if (!target) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Target member not in this family');
  }
  if (target.role === 'PRIMARY') {
    await ensureOtherPrimaryExists(familyId, targetUserId);
  }
  await prisma.familyMember.delete({
    where: { userId_familyId: { userId: targetUserId, familyId } },
  });
}
