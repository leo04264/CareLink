import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../plugins/error-handler';
import { prisma } from './prisma';

// Throws NOT_FOUND (not UNAUTHORIZED) when the caller isn't in the family —
// avoids leaking whether the family exists to outsiders. Returns the member
// row so callers can read role + other columns without re-querying.
export async function assertMember(userId: string, familyId: string) {
  const m = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });
  if (!m) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Family not found or you are not a member');
  }
  return m;
}

// PRIMARY-only gate. NOT_FOUND first (same "don't leak existence" reasoning),
// then AUTH_UNAUTHORIZED when the caller is a member but not PRIMARY.
export async function assertPrimary(userId: string, familyId: string) {
  const m = await assertMember(userId, familyId);
  if (m.role !== 'PRIMARY') {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Only PRIMARY members can perform this action');
  }
  return m;
}

// Same idea but elder-rooted: confirm the caller is in the elder's family.
// Used by /elders/:id routes that take elder-level IDs directly.
export async function assertElderAccess(userId: string, elderId: string) {
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { id: true, familyId: true },
  });
  if (!elder) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found');
  }
  await assertMember(userId, elder.familyId);
  return elder;
}
