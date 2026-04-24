import IORedis from 'ioredis';
import { Queue } from 'bullmq';

// BullMQ needs `maxRetriesPerRequest: null` on ioredis for blocking ops.
// Singleton so hot-reload doesn't spawn a new pool each tsx-watch restart.
declare global {
  // eslint-disable-next-line no-var
  var __carelinkRedis: IORedis | undefined;
}

export const redis =
  global.__carelinkRedis ??
  new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__carelinkRedis = redis;
}

// One queue per cron concern. Workers subscribe to each by name.
export const medicationReminderQueue = new Queue('medication-reminder', { connection: redis });
export const checkinAlertQueue = new Queue('checkin-alert', { connection: redis });
export const appointmentReminderQueue = new Queue('appointment-reminder', { connection: redis });

// Job names (typed so workers + producers can't drift apart).
export const JobNames = {
  // medication-reminder
  MED_REMIND: 'med-remind',
  MED_CHECK_MISSED: 'med-check-missed',
  MED_SCAN: 'med-scan', // repeatable every minute
  // checkin-alert
  CHECKIN_SCAN: 'checkin-scan', // repeatable daily at 10:00 local
  CHECKIN_OVERDUE: 'checkin-overdue',
  // appointment-reminder
  APPT_SCAN: 'appt-scan', // repeatable daily at 09:00 local
  APPT_REMIND: 'appt-remind',
} as const;
