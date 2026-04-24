import { Worker, Job } from 'bullmq';
import { JobNames, appointmentReminderQueue, redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { notifyFamily } from '../lib/notify';

// Runs once per day (09:00 server-local by default). For every UPCOMING
// appointment, if `daysLeft` is in the `remindDays[]` array → queue a
// per-appt reminder job.

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function handleScan(): Promise<void> {
  const now = new Date();
  const appts = await prisma.appointment.findMany({
    where: { status: 'UPCOMING', scheduledAt: { gte: now } },
    include: { elder: { select: { name: true } } },
  });
  for (const a of appts) {
    const daysLeft = daysBetween(now, a.scheduledAt);
    if (a.remindDays.includes(daysLeft)) {
      await appointmentReminderQueue.add(JobNames.APPT_REMIND, {
        apptId: a.id,
        elderId: a.elderId,
        elderName: a.elder.name,
        department: a.department,
        hospital: a.hospital,
        daysLeft,
      });
    }
  }
}

async function handleRemind(job: Job): Promise<void> {
  const { elderId, elderName, department, hospital, daysLeft, apptId } = job.data as {
    elderId: string;
    elderName: string;
    department: string;
    hospital: string;
    daysLeft: number;
    apptId: string;
  };
  const when = daysLeft === 0 ? '今天' : `還有 ${daysLeft} 天`;
  await notifyFamily({
    elderId,
    type: 'APPOINTMENT',
    title: `🏥 ${elderName} 的 ${department} ${when}`,
    body: `${hospital}`,
    data: { apptId, daysLeft },
  });
}

export function startAppointmentReminderWorker(): Worker {
  const worker = new Worker(
    'appointment-reminder',
    async (job) => {
      if (job.name === JobNames.APPT_SCAN) return handleScan();
      if (job.name === JobNames.APPT_REMIND) return handleRemind(job);
    },
    { connection: redis, concurrency: 4 },
  );
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker:appt-reminder] job ${job?.id} ${job?.name} failed:`, err);
  });
  return worker;
}
