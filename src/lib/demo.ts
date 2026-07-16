// Decorative, deterministic demo data for fields the backend does not provide
// (ratings, reviews, categories, salon/address). Real data (name, services,
// slots) always comes from the API. Everything here is derived from the barber
// id so it stays stable across renders.

import type { ActiveBarber } from '@/types/api';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  iconColor: string;
}

export const CATEGORIES: Category[] = [
  { id: 'haircut', name: 'اصلاح مو', icon: '✂️', color: '#E8F0FE', iconColor: '#3B6FE8' },
  { id: 'beard', name: 'اصلاح ریش', icon: '🧔', color: '#FFF7ED', iconColor: '#EA580C' },
  { id: 'color', name: 'رنگ و مش', icon: '🎨', color: '#FDF2F8', iconColor: '#DB2777' },
  { id: 'kids', name: 'کودکان', icon: '👦', color: '#EEF2FF', iconColor: '#4F46E5' },
  { id: 'package', name: 'پکیج ویژه', icon: '⭐', color: '#FEF3C7', iconColor: '#D97706' },
  { id: 'styling', name: 'استایل مو', icon: '💇', color: '#E8F7EE', iconColor: '#22A45C' },
];

const AVATAR_COLORS = ['#22A45C', '#3B6FE8', '#EA580C', '#4F46E5', '#DB2777', '#D97706', '#0EA5E9', '#7C3AED'];

/** Deterministic avatar color for a barber id (consistent across the app). */
export function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

/** First character of a name, with a fallback glyph. */
export function avatarInitial(name: string): string {
  return (name || '?').trim().charAt(0) || '؟';
}
const SPECIALTIES = [
  'آرایشگر مردانه',
  'متخصص رنگ و مش',
  'آرایشگر سنتی',
  'متخصص کودکان',
  'متخصص رنگ مو',
  'آرایشگر VIP',
  'استایلیست حرفه‌ای',
];
const SALON_PREFIX = ['آرایشگاه', 'سالن زیبایی', 'استودیو مو', 'باربرشاپ'];
const ADDRESSES = [
  'تهران، ونک، خیابان ملاصدرا',
  'تهران، سعادت‌آباد، میدان کاج',
  'تهران، تجریش، خیابان ولیعصر',
  'تهران، پاسداران، بوستان هفتم',
  'تهران، شهرک غرب، فاز ۲',
  'تهران، نیاوران، خیابان باهنر',
];
const EXPERIENCES = ['۴ سال', '۶ سال', '۷ سال', '۸ سال', '۱۰ سال', '۱۲ سال'];

const REVIEW_AUTHORS = ['رضا کریمی', 'امیر حسینی', 'محمد رضایی', 'سعید نوری', 'پویا احمدی', 'جواد مرادی', 'کامران صادقی', 'نیما جعفری'];
const REVIEW_TEXTS = [
  'عالی بود، خیلی حرفه‌ای کار کرد.',
  'بهترین آرایشگر منطقه، حتما پیشنهاد می‌کنم.',
  'کیفیت خوب و برخورد عالی.',
  'محیط تمیز و سرویس سریع.',
  'دقیق و باحوصله، راضی بودم.',
  'قیمت مناسب و کیفیت بالا.',
];
const REVIEW_DATES = ['۲ روز پیش', '۵ روز پیش', '۱ هفته پیش', '۱۰ روز پیش', '۲ هفته پیش'];

function hash(n: number): number {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  return x >>> 0;
}

function pick<T>(arr: T[], n: number, salt = 0): T {
  return arr[(hash(n + salt * 97) % arr.length + arr.length) % arr.length];
}

export interface DecoratedBarber {
  id: number;
  name: string;
  initial: string;
  color: string;
  specialty: string;
  salon: string;
  address: string;
  rating: number;
  reviews: number;
  experience: string;
  categories: string[];
  featured: boolean;
}

export function decorateBarber(b: ActiveBarber): DecoratedBarber {
  const h = hash(b.id);
  const catCount = 2 + (h % 3); // 2..4 categories
  const startCat = h % CATEGORIES.length;
  const categories: string[] = [];
  for (let i = 0; i < catCount; i++) {
    categories.push(CATEGORIES[(startCat + i) % CATEGORIES.length].id);
  }

  return {
    id: b.id,
    name: b.name,
    initial: (b.name || '?').trim().charAt(0) || '؟',
    color: AVATAR_COLORS[b.id % AVATAR_COLORS.length],
    specialty: pick(SPECIALTIES, b.id, 1),
    salon: `${pick(SALON_PREFIX, b.id, 2)} ${b.name.split(' ')[0] || ''}`.trim(),
    address: pick(ADDRESSES, b.id, 3),
    rating: 4.5 + (h % 5) / 10, // 4.5 .. 4.9
    reviews: 60 + (h % 280),
    experience: pick(EXPERIENCES, b.id, 4),
    categories,
    featured: h % 3 === 0,
  };
}

export interface DemoReview {
  author: string;
  initial: string;
  color: string;
  rating: number;
  text: string;
  date: string;
}

export function reviewsFor(id: number): DemoReview[] {
  const count = 2 + (hash(id) % 2); // 2..3 reviews
  const out: DemoReview[] = [];
  for (let i = 0; i < count; i++) {
    const author = pick(REVIEW_AUTHORS, id, i + 5);
    out.push({
      author,
      initial: author.charAt(0),
      color: AVATAR_COLORS[(id + i) % AVATAR_COLORS.length],
      rating: 4 + (hash(id + i) % 2), // 4 or 5
      text: pick(REVIEW_TEXTS, id, i + 11),
      date: pick(REVIEW_DATES, id, i + 17),
    });
  }
  return out;
}

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
