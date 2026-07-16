const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianNum(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function parsePrice(price: string | number): number {
  return typeof price === 'number' ? price : parseFloat(price || '0');
}

export function formatPrice(price: string | number): string {
  const n = parsePrice(price);
  return `${toPersianNum(n.toLocaleString('en-US'))} تومان`;
}

/** "14:30:00" or "14:30" -> "14:30" */
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

/** Persian-digit time label, e.g. "۱۴:۳۰". */
export function timeLabel(time: string): string {
  return toPersianNum(shortTime(time));
}
