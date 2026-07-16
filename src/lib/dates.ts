// Jalali (Persian) date helpers backed by the Intl API, so labels match the
// user's calendar while the backend still receives Gregorian ISO dates.

const faWeekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' });
const faDay = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' });
const faMonth = new Intl.DateTimeFormat('fa-IR', { month: 'long' });
const faFull = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

// Backend appointment_time is a full ISO datetime; format it in the project's
// timezone (Asia/Tehran) so the day/time shown matches what the barber set.
const TEHRAN_TZ = 'Asia/Tehran';
const faFullTehran = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TEHRAN_TZ });
const faTimeTehran = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TEHRAN_TZ });

/** "پنجشنبه ۲۱ خرداد" from an ISO datetime, in Tehran time. */
export function dateTimeDayLabel(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return Number.isNaN(d.getTime()) ? isoDateTime : faFullTehran.format(d);
}

/** "۰۹:۰۰" from an ISO datetime, in Tehran time. */
export function dateTimeClockLabel(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return Number.isNaN(d.getTime()) ? '' : faTimeTehran.format(d);
}

export interface DayOption {
  iso: string; // "YYYY-MM-DD" in local time
  weekdayLabel: string; // "امروز" / "فردا" / weekday name
  dayNum: string; // Persian-digit day of month
  monthLabel: string; // Jalali month name
  isToday: boolean;
}

/** Local YYYY-MM-DD (avoids the UTC off-by-one of toISOString). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateDates(count = 14): DayOption[] {
  const out: DayOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: toIsoDate(d),
      weekdayLabel: i === 0 ? 'امروز' : i === 1 ? 'فردا' : faWeekday.format(d),
      dayNum: faDay.format(d),
      monthLabel: faMonth.format(d),
      isToday: i === 0,
    });
  }
  return out;
}

/** "پنجشنبه ۲۱ خرداد" from an ISO date. */
export function fullDateLabel(iso: string): string {
  const d = parseIso(iso);
  if (!d) return iso;
  return faFull.format(d);
}

export function parseIso(iso: string): Date | null {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, m, day] = parts;
  return new Date(y, m - 1, day);
}

// ===== Jalali calendar grid =====
// The Intl helpers above format single Jalali labels but can't build a month
// grid. The conversions below are the standard jalaali-js algorithm, used by the
// date-settings calendar to map Jalali year/month cells to/from Gregorian ISO.
// Weekday columns are 0 = Saturday … 6 = Friday, matching the backend.

export interface JalaliDate {
  jy: number;
  jm: number; // 1..12
  jd: number; // 1..31
}

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** Weekday short labels, Saturday-first to match the backend's weekday order. */
export const JALALI_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const JALALI_WEEKDAYS_FULL = [
  'شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه',
];

const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
    2262, 2324, 2394, 2456, 3178,
  ];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** Days in a Jalali month (29/30/31, leap-aware). */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

/** Gregorian → Jalali. */
export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

/** Jalali → Gregorian ISO date "YYYY-MM-DD" (local). */
export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const g = d2g(j2d(jy, jm, jd));
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

/** Weekday column for a Jalali date: 0 = Saturday … 6 = Friday. */
export function jalaliWeekdayColumn(jy: number, jm: number, jd: number): number {
  const g = d2g(j2d(jy, jm, jd));
  return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
}

/** Today as a Jalali date. */
export function todayJalali(): JalaliDate {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Jalali parts of a Gregorian ISO date. */
export function isoToJalali(iso: string): JalaliDate | null {
  const d = parseIso(iso);
  if (!d) return null;
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
