import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getTodayCheckin } from './checkin';

// Caregiver-side derived status from /elders/:id/checkins/today.
// 'ok' — already checked in today.
// 'warning' — no checkin yet today.
// (We don't currently derive 'critical' >24h locally — that requires
//  lastCheckinAt from /streak. Caregiver-side notification module
//  triggers the explicit "超過 24h" banner via its own data path.
//  Upgrading this to a 'critical' tier is a follow-up once we add
//  push notifications; see PR M roadmap notes.)

export type LiveStatus = 'ok' | 'warning' | null; // null while loading

// Decision #4: 5-minute polling + on-foreground refetch. Push-based
// invalidation is the future fix (PR with Expo Push subscription on
// caregiver side). 5 min × 24h × N caregivers stays at single-digit
// req/min/family — acceptable until we have real users.
const POLL_MS = 5 * 60 * 1000;

export function useLiveReportStatus(elderId: string | null, enabled: boolean): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !elderId) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const today = await getTodayCheckin(elderId);
        if (cancelled) return;
        setStatus(today.checked ? 'ok' : 'warning');
      } catch {
        // Network glitch — keep last known status, fall through to
        // 'warning' if we never had one.
        if (!cancelled) setStatus((prev) => prev ?? 'warning');
      }
    };

    fetchStatus();
    timerRef.current = setInterval(fetchStatus, POLL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchStatus();
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [elderId, enabled]);

  return status;
}
