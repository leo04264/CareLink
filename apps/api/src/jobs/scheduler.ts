import {
  JobNames,
  appointmentReminderQueue,
  checkinAlertQueue,
  medicationReminderQueue,
} from '../lib/redis';

// Registers all three recurring scans as BullMQ repeatable jobs.
// Idempotent: adding the same (name, every) pair is a no-op, so it's safe
// to call on every worker boot.
export async function registerRecurringJobs(): Promise<void> {
  // NOTE(spec §6.2): cron expressions use the worker process's local TZ.
  // In this repo's local-dev + Fly config, that's UTC — so "10:00 local"
  // for Taiwan caregivers actually means running at 02:00 UTC. Adjust by
  // setting TZ=Asia/Taipei on the worker container in production.

  // Medication scan — every minute
  await medicationReminderQueue.add(
    JobNames.MED_SCAN,
    {},
    {
      repeat: { every: 60_000 },
      jobId: 'med-scan-recurring',
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );

  // Checkin overdue scan — daily at 10:00 server-local
  await checkinAlertQueue.add(
    JobNames.CHECKIN_SCAN,
    {},
    {
      repeat: { pattern: '0 10 * * *' },
      jobId: 'checkin-scan-recurring',
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );

  // Appointment reminder scan — daily at 09:00 server-local
  await appointmentReminderQueue.add(
    JobNames.APPT_SCAN,
    {},
    {
      repeat: { pattern: '0 9 * * *' },
      jobId: 'appt-scan-recurring',
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
}
