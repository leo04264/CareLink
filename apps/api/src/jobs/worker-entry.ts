import 'dotenv/config';
import { startMedicationReminderWorker } from './medication-reminder.worker';
import { startCheckinAlertWorker } from './checkin-alert.worker';
import { startAppointmentReminderWorker } from './appointment-reminder.worker';
import { registerRecurringJobs } from './scheduler';

// Separate process entry (decision from PR K Gate 1 #1). Start with
// `npm run dev:workers`. The Fastify API server does NOT boot workers —
// ENABLE_WORKERS exists only as a dev escape hatch.

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[workers] starting…');

  const medWorker = startMedicationReminderWorker();
  const checkinWorker = startCheckinAlertWorker();
  const apptWorker = startAppointmentReminderWorker();

  await registerRecurringJobs();
  // eslint-disable-next-line no-console
  console.log('[workers] ready — 3 workers + 3 recurring scans registered');

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`[workers] received ${signal}, shutting down…`);
    await Promise.all([medWorker.close(), checkinWorker.close(), apptWorker.close()]);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[workers] fatal:', err);
  process.exit(1);
});
