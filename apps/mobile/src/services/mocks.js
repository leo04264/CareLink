// ============================================================================
// MOCK SERVICE LAYER
// ============================================================================
// Every function here **simulates** a backend / native-integration call.
// They all:
//   - Log a `[MOCK]` line to console so it's obvious during demo what's fake
//   - Return a Promise (ms delay) so call sites are already written async
//   - Optionally show an Alert / window.alert for actions that would have
//     side-effects in the real world (撥 119, 撥電話, 送 SOS...)
//
// See `MOCKS.md` at the repo root for the migration checklist. Before going
// live, every function in this file must be replaced with a real
// implementation (REST / GraphQL / Firebase / native Linking, etc).
// ============================================================================

import { Alert, Linking, Platform } from 'react-native';

// ---- tiny helpers ---------------------------------------------------------
const log = (tag, msg, ...rest) => console.log(`[MOCK] ${tag}`, msg, ...rest);
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function mockAlert(title, body) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${body}`);
    }
    return;
  }
  Alert.alert(title, body, [{ text: '了解' }]);
}

// ---- shared in-memory "DB" ------------------------------------------------
// Normally this would live on the server. Kept here so the mocks feel
// persistent across a single app session (but not across reloads).
const db = {
  lastReport: null, // Date | null — 長輩最後一次「我很好」
  vitals: [], // { id, type, at, sys, dia, bs, ctx, source }
  medDoses: [], // { id, medId, at, confirmed, photoUri? }
  appointments: [], // (seeded by AppointmentsScreen for now)
  contacts: [],
  notifications: [], // pushed events
  location: { lat: 25.0574, lng: 121.5316, accuracy: 50, updatedAt: new Date() },
  geofence: { radiusKm: 1, enabled: true },
};

export function __getMockDB() {
  return db;
}

// ============================================================================
// 1. EMERGENCY — SOS broadcast + 119 call
// ============================================================================

/**
 * MOCK: Broadcast SOS to emergency contacts.
 *
 * Production implementation should:
 *   - POST /api/emergency/sos with { elderId, triggeredAt, coords }
 *   - Backend fans out: push notification → SMS fallback → voice call fallback
 *     in priority order, stopping when any contact ACKs
 *   - Return a stream of delivery events so the UI can show 「✓ 已通知」 per contact
 */
export async function broadcastSOS({ elderName = '媽媽', contacts = [] }) {
  log('broadcastSOS', { elderName, contactCount: contacts.length });
  await delay(300);
  return {
    ok: true,
    notified: contacts.filter((c) => c.enabled).map((c) => ({ id: c.id, notifiedAt: new Date() })),
  };
}

/**
 * MOCK: Dial 119 emergency services.
 *
 * Production implementation:
 *   - iOS / Android: `Linking.openURL('tel:119')`
 *     (requires `tel:*` in Info.plist LSApplicationQueriesSchemes for iOS)
 *   - Web: `window.location.href = 'tel:119'` — works on mobile browsers,
 *     desktop shows a handler-chooser; may want to show a modal explaining
 *   - Consider legal disclaimer / 2-step confirmation before actually dialing
 *   - Log the event server-side for audit trail
 *
 * This mock only alerts the user and logs — it does NOT dial.
 */
export async function call119() {
  log('call119', 'would dial tel:119');
  mockAlert(
    '[MOCK] 假撥打 119',
    '正式上線時，這裡會 Linking.openURL(\'tel:119\') 真的撥出。\n此次不會實際撥打。'
  );
  await delay(200);
  return { ok: true, mocked: true };
}

// ============================================================================
// 2. PHONE — contact-to-contact call
// ============================================================================

/**
 * MOCK: Open the native phone dialer for `number`.
 *
 * Production:
 *   - `Linking.openURL(\`tel:${number}\`)` on native
 *   - On web: render a `<a href="tel:...">` or `window.location.href`
 */
export async function dial(number) {
  log('dial', number);
  mockAlert('[MOCK] 假撥打電話', `號碼：${number}\n正式上線會呼叫 Linking.openURL('tel:${number}')`);
  await delay(150);
  return { ok: true, mocked: true };
}

// ============================================================================
// 3. ELDER DAILY REPORT — 「我很好」 check-in
// ============================================================================

/**
 * MOCK: Elder presses 「我很好」. Production writes to the elder's status
 * doc and triggers a push to each caregiver subscribed to this elder.
 *
 * Production endpoint: POST /api/elders/:id/report { at: ISOString }
 */
export async function reportOK() {
  db.lastReport = new Date();
  log('reportOK', `lastReport = ${db.lastReport.toISOString()}`);
  await delay(200);
  return { ok: true, at: db.lastReport };
}

export function getLastReport() {
  return db.lastReport;
}

// ============================================================================
// 4. VITALS — blood pressure / blood sugar records
// ============================================================================

/**
 * MOCK: Save a vitals reading. Production writes to the user's health
 * record table and fan-outs to caregiver's dashboard in near-real-time.
 */
export async function recordVital(entry) {
  const rec = { id: Date.now(), at: new Date(), ...entry };
  db.vitals.unshift(rec);
  log('recordVital', rec);
  await delay(250);
  return { ok: true, id: rec.id };
}

export async function fetchVitals({ limit = 20 } = {}) {
  log('fetchVitals', { limit });
  await delay(120);
  return db.vitals.slice(0, limit);
}

// ============================================================================
// 5. MEDICATIONS — dose confirmation (incl. AI photo verification)
// ============================================================================

/**
 * MOCK: Confirm a medication dose (optionally with a photo).
 *
 * Production:
 *   - Upload photo to object storage (S3 / Firebase Storage)
 *   - Run vision model for pill recognition / count
 *   - Store dose log row
 *   - Push to caregiver: 「媽媽已服用 安眠藥」
 */
export async function confirmMedDose({ medId = null, medName = '未指定', photoUri = null }) {
  const rec = { id: Date.now(), medId, medName, at: new Date(), confirmed: true, photoUri };
  db.medDoses.unshift(rec);
  log('confirmMedDose', rec);
  // Simulate AI verification latency (2s) — the UI screen also waits 2s so this is additive-zero
  await delay(300);
  return { ok: true, verified: true, id: rec.id };
}

// ============================================================================
// 6. APPOINTMENTS
// ============================================================================

/**
 * MOCK: CRUD for 回診行程. Production stores rows keyed by elderId.
 */
export async function createAppointment(appt) {
  const rec = { id: Date.now(), ...appt };
  db.appointments.unshift(rec);
  log('createAppointment', rec);
  await delay(200);
  return { ok: true, id: rec.id };
}

export async function updateAppointment(id, patch) {
  log('updateAppointment', { id, patch });
  db.appointments = db.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a));
  await delay(150);
  return { ok: true };
}

export async function deleteAppointment(id) {
  log('deleteAppointment', id);
  db.appointments = db.appointments.filter((a) => a.id !== id);
  await delay(150);
  return { ok: true };
}

// ============================================================================
// 7. EMERGENCY CONTACTS
// ============================================================================

export async function saveContact(c) {
  log('saveContact', c);
  await delay(150);
  return { ok: true };
}

export async function deleteContact(id) {
  log('deleteContact', id);
  await delay(150);
  return { ok: true };
}

// ============================================================================
// 8. LOCATION / GEOFENCE
// ============================================================================

/**
 * MOCK: Elder device location.
 *
 * Production:
 *   - Request `expo-location` permissions, watch position
 *   - Stream to backend; caregiver subscribes
 *   - Geofence evaluated server-side; push on exit
 */
export async function fetchElderLocation() {
  log('fetchElderLocation');
  await delay(200);
  return { ...db.location, mocked: true };
}

export function setGeofence({ radiusKm, enabled }) {
  db.geofence = { radiusKm, enabled };
  log('setGeofence', db.geofence);
}

// ============================================================================
// 9. NOTIFICATIONS
// ============================================================================

/**
 * MOCK: Server push notifications → client list.
 *
 * Production:
 *   - FCM / APNs for push delivery
 *   - REST endpoint for history: GET /api/notifications?since=...
 *   - WebSocket / long-poll for live updates
 */
export async function fetchNotifications() {
  log('fetchNotifications');
  await delay(150);
  return db.notifications;
}

export async function markNotificationRead(id) {
  log('markNotificationRead', id);
  db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  await delay(100);
  return { ok: true };
}

export async function dismissNotification(id) {
  log('dismissNotification', id);
  db.notifications = db.notifications.filter((n) => n.id !== id);
  await delay(100);
  return { ok: true };
}

// ============================================================================
// 10. PROFILE / SETTINGS PERSISTENCE
// ============================================================================

/**
 * MOCK: Save elder profile. Production hits PATCH /api/elders/:id.
 */
export async function saveElderProfile(profile) {
  log('saveElderProfile', profile);
  await delay(200);
  return { ok: true };
}

export async function saveNotificationSettings(settings) {
  log('saveNotificationSettings', settings);
  await delay(150);
  return { ok: true };
}

export async function saveLocationSettings(settings) {
  log('saveLocationSettings', settings);
  await delay(150);
  return { ok: true };
}
