// pm2 ecosystem for the Mac Mini local-backend setup.
// Usage:
//   pm2 start scripts/pm2.config.cjs
//   pm2 reload scripts/pm2.config.cjs --update-env
//
// Both processes run from the repo root so relative paths in the
// compiled output resolve correctly. Logs land under ~/.pm2/logs by
// default (`pm2 logs carelink-api` to tail).

const path = require('path');
const repoRoot = path.resolve(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'carelink-api',
      cwd: repoRoot,
      script: 'apps/api/dist/server.js',
      node_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
      },
      // Restart policy — Fastify exits non-zero on bind failure; let pm2
      // back off rather than thrash.
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
    },
    {
      name: 'carelink-workers',
      cwd: repoRoot,
      script: 'apps/api/dist/jobs/worker-entry.js',
      node_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
        // Crons (medication / checkin / appointment) read this. Mac Mini
        // is in Taipei so reminders fire at the local 09:00/10:00 the
        // caregiver expects.
        TZ: 'Asia/Taipei',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
    },
  ],
};
