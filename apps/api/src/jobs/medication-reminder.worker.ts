import { Worker, Job } from 'bullmq';
import { JobNames, medicationReminderQueue, redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { notifyFamily } from '../lib/notify';
import { sendPush } from '../lib/expo-push';

// Every minute we ask: "any enabled schedule whose time matches now"?
// For each match we enqueue:
//   (a) MED_REMIND — push to elder's own device
//   (b) MED_CHECK_MISSED (delayed 60 min) — if no log by then, push caregivers
function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function handleScan(): Promise<void> {
  const time = nowHHMM();
  const schedules = await prisma.medicationSchedule.findMany({
    where: { time, isEnabled: true, medication: { status: 'ACTIVE' } },
    include: { medication: true },
  });
  for (const s of schedules) {
    await medicationReminderQueue.add(JobNames.MED_REMIND, {
      scheduleId: s.id,
      medicationId: s.medication.id,
      elderId: s.medication.elderId,
      time: s.time,
    });
    await medicationReminderQueue.add(
      JobNames.MED_CHECK_MISSED,
      {
        scheduleId: s.id,
        medicationId: s.medication.id,
        elderId: s.medication.elderId,
        time: s.time,
      },
      { delay: 60 * 60 * 1000 },
    );
  }
}

async function handleRemind(job: Job): Promise<void> {
  const { elderId, medicationId, time } = job.data as {
    elderId: string;
    medicationId: string;
    time: string;
  };
  const med = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: { elder: { select: { deviceToken: true, name: true } } },
  });
  if (!med || med.status !== 'ACTIVE') return;

  // Ping the elder's own device — they're the one who should take the pill.
  if (med.elder.deviceToken) {
    await sendPush({
      to: [med.elder.deviceToken],
      title: `💊 該吃 ${med.name} 了`,
      body: `${time}・${med.dosage ?? ''}${med.amountPerDose ? `・${med.amountPerDose}` : ''}`,
      data: { type: 'MEDICATION', medicationId, scheduleTime: time },
    });
  }
}

async function handleCheckMissed(job: Job): Promise<void> {
  const { elderId, medicationId, time } = job.data as {
    elderId: string;
    medicationId: string;
    time: string;
  };
  // Look for a log within a 1-hour window around the schedule time, to
  // tolerate small clock drift.
  const windowStart = new Date(Date.now() - 90 * 60 * 1000);
  const log = await prisma.medicationLog.findFirst({
    where: {
      medicationId,
      scheduleTime: time,
      takenAt: { gte: windowStart },
    },
  });
  if (log) return; // all good, was taken
  const med = await prisma.medication.findUnique({
    where: { id: medicationId },
    select: { name: true, status: true, elder: { select: { name: true } } },
  });
  if (!med || med.status !== 'ACTIVE') return;

  await notifyFamily({
    elderId,
    type: 'MEDICATION_MISSED',
    title: `⚠️ ${med.elder.name} 漏服 ${med.name}`,
    body: `${time} 的藥物已超過 1 小時未確認`,
    data: { medicationId, scheduleTime: time },
  });
}

export function startMedicationReminderWorker(): Worker {
  const worker = new Worker(
    'medication-reminder',
    async (job) => {
      if (job.name === JobNames.MED_SCAN) return handleScan();
      if (job.name === JobNames.MED_REMIND) return handleRemind(job);
      if (job.name === JobNames.MED_CHECK_MISSED) return handleCheckMissed(job);
    },
    { connection: redis, concurrency: 4 },
  );
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker:med-reminder] job ${job?.id} ${job?.name} failed:`, err);
  });
  return worker;
}
