import { Worker, Job } from 'bullmq';
import { JobNames, checkinAlertQueue, redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { notifyFamily } from '../lib/notify';

// Runs once per day (10:00 server-local by default). For every elder in
// the DB, if there is no Checkin row after midnight → queue a per-elder
// overdue job which writes + pushes CHECKIN_OVERDUE.

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function handleScan(): Promise<void> {
  const since = startOfDay();
  const elders = await prisma.elder.findMany({ select: { id: true, name: true } });
  for (const elder of elders) {
    const checked = await prisma.checkin.findFirst({
      where: { elderId: elder.id, checkedAt: { gte: since } },
      select: { id: true },
    });
    if (!checked) {
      await checkinAlertQueue.add(JobNames.CHECKIN_OVERDUE, {
        elderId: elder.id,
        elderName: elder.name,
      });
    }
  }
}

async function handleOverdue(job: Job): Promise<void> {
  const { elderId, elderName } = job.data as { elderId: string; elderName: string };
  await notifyFamily({
    elderId,
    type: 'CHECKIN_OVERDUE',
    title: `⚠️ ${elderName} 今天還沒回報`,
    body: '已超過 10 小時未按「我很好」，請關心一下',
    data: { elderId },
  });
}

export function startCheckinAlertWorker(): Worker {
  const worker = new Worker(
    'checkin-alert',
    async (job) => {
      if (job.name === JobNames.CHECKIN_SCAN) return handleScan();
      if (job.name === JobNames.CHECKIN_OVERDUE) return handleOverdue(job);
    },
    { connection: redis, concurrency: 4 },
  );
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker:checkin-alert] job ${job?.id} ${job?.name} failed:`, err);
  });
  return worker;
}
