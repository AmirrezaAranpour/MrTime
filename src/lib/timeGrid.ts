// Shared 30-minute time grid for the availability editors (weekly + date).
// Times are tracked as minutes-from-midnight inside the editors and converted
// to backend "HH:MM" strings on save. The window stops at 24:00 (midnight),
// which the backend's TimeField can't store, so it's clamped to 23:59.
import { toPersianNum } from './format';

export const WIN_START = 360; // 06:00
export const WIN_END = 1440; // 24:00 (sent to the backend as 23:59)
export const STEP = 30;
export const SPAN = WIN_END - WIN_START;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Minutes -> Persian-digit "HH:MM" label. */
export const fmt = (m: number) => toPersianNum(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);

/** Minutes -> "HH:MM" for the API; 24:00 clamps to the backend-valid 23:59. */
export function minutesToApi(m: number): string {
  if (m >= WIN_END) return '23:59';
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** "HH:MM[:SS]" -> minutes, snapped to the 30-min grid (23:59 -> 24:00). */
export function apiToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + (m || 0);
  if (total >= 1439) return WIN_END;
  return Math.round(total / STEP) * STEP;
}

export const TIME_OPTIONS: { value: number; label: string }[] = (() => {
  const out: { value: number; label: string }[] = [];
  for (let m = WIN_START; m <= WIN_END; m += STEP) out.push({ value: m, label: fmt(m) });
  return out;
})();
