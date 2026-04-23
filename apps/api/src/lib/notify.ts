import type { NotificationType } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { prisma } from './prisma';

interface NotifyFamilyInput {
  elderId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: InputJsonValue;
}

// Fans out to every caregiver user in the elder's family. Writes one
// `Notification` row per recipient.
//
// TODO(PR K — notifications + BullMQ): after insert, push via Expo/FCM
// using the caregiver's registered push tokens. For now, the caregiver
// app polls GET /users/:id/notifications to see new items.
export async function notifyFamily(input: NotifyFamilyInput): Promise<{ count: number }> {
  const members = await prisma.familyMember.findMany({
    where: { family: { elders: { some: { id: input.elderId } } } },
    select: { userId: true },
  });
  if (members.length === 0) return { count: 0 };

  const now = new Date();
  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
      createdAt: now,
    })),
  });
  return { count: members.length };
}
