// pm2 ecosystem for the Mac Mini local-backend setup.
// Usage:
//   pm2 start scripts/pm2.config.cjs
//   pm2 reload scripts/pm2.config.cjs --update-env
//
// Runs the TypeScript source directly via tsx so we don't have to keep
// `apps/api/dist/` and the workspace-linked `@carelink/shared` in sync —
// shared currently exports its `.ts` source from package.json#main, which
// `node` can't load. tsx hooks the loader and resolves both seamlessly.
//
// When PR P (or whenever) gives `@carelink/shared` a real `dist/`, we can
// switch back to `node apps/api/dist/server.js` for a more production-y
// invocation. Until then, tsx is the right tool for this local-demo box.
//
// Logs land under ~/.pm2/logs (`pm2 logs carelink-api` to tail).

const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');

module.exports = {
  apps: [
    {
      name: 'carelink-api',
      cwd: path.join(repoRoot, 'apps/api'),
      script: 'src/server.ts',
      interpreter: tsxBin,
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
      cwd: path.join(repoRoot, 'apps/api'),
      script: 'src/jobs/worker-entry.ts',
      interpreter: tsxBin,
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
