import { useMemo, useState } from 'react';
import { getAppointments, updateStatus, type StoredAppointment } from '@/lib/appointmentsStore';
import type { AppointmentStatus } from '@/types/api';
import { generateDates } from '@/lib/dates';
import { formatPrice, parsePrice, timeLabel, toPersianNum } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageIcon,
  PhoneIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  XIcon,
} from '@/components/icons';

const STATUS: Record<AppointmentStatus, { label: string; bg: string; color: string; dot: string }> = {
  r: { label: 'تأییدشده', bg: '#E8F7EE', color: '#1B8A4A', dot: '#22A45C' },
  p: { label: 'در انتظار', bg: '#FEF3E0', color: '#B45309', dot: '#D97706' },
  f: { label: 'انجام‌شده', bg: '#EEF0F2', color: '#5B6470', dot: '#9AA3AD' },
  c: { label: 'لغو‌شده', bg: '#FEECEB', color: '#B42318', dot: '#D92D20' },
};

const WINDOW_DAYS = 7;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '؟';
  return parts.map((w) => w[0]).slice(0, 2).join('');
}

export default function BarberAppointmentsPage() {
  const showToast = useToast();
  const days = useMemo(() => generateDates(WINDOW_DAYS), []);
  const todayIdx = Math.max(0, days.findIndex((d) => d.isToday));

  const [view, setView] = useState<'day' | 'week'>('day');
  const [selected, setSelected] = useState(todayIdx);
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0);

  const all = useMemo(() => getAppointments(), [version]);

  // Index appointments by ISO date, each day sorted by start time.
  const byDate = useMemo(() => {
    const map = new Map<string, StoredAppointment[]>();
    for (const a of all) {
      const list = map.get(a.dateIso) ?? [];
      list.push(a);
      map.set(a.dateIso, list);
    }
    for (const list of map.values()) list.sort((x, y) => x.startTime.localeCompare(y.startTime));
    return map;
  }, [all]);

  const q = query.trim().toLowerCase();
  const dayAppts = (iso: string) =>
    (byDate.get(iso) ?? []).filter(
      (a) => !q || a.customerName.toLowerCase().includes(q) || a.customerPhone.includes(q),
    );

  const groups =
    view === 'day'
      ? [{ key: days[selected].iso, day: days[selected], showHeader: false, items: dayAppts(days[selected].iso) }]
      : days
          .map((d) => ({ key: d.iso, day: d, showHeader: true, items: dayAppts(d.iso) }))
          .filter((g) => g.items.length);

  // Summary covers the visible scope, excluding cancelled rows.
  const scope = view === 'day' ? [days[selected]] : days;
  const live = scope.flatMap((d) => dayAppts(d.iso)).filter((a) => a.status !== 'c');
  const summaryCount = live.length;
  const summaryConfirmed = live.filter((a) => a.status === 'r').length;
  const summaryRevenue = live.reduce((sum, a) => sum + parsePrice(a.price), 0);

  const headerTitle =
    view === 'day'
      ? `${days[selected].weekdayLabel} ${days[selected].dayNum} ${days[selected].monthLabel}`
      : `${days[0].dayNum} ${days[0].monthLabel} تا ${days[WINDOW_DAYS - 1].dayNum} ${days[WINDOW_DAYS - 1].monthLabel}`;

  const step = (delta: number) => {
    setView('day');
    setSelected((s) => Math.min(WINDOW_DAYS - 1, Math.max(0, s + delta)));
  };

  const setStatus = (a: StoredAppointment, status: AppointmentStatus, message: string) => {
    updateStatus(a.id, status);
    setVersion((v) => v + 1);
    showToast(message);
  };

  return (
    <>
      <div className="dash-head">
        <h1>نوبت‌ها</h1>
        <p>{headerTitle}</p>
      </div>

      <div className="dash-card">
        {/* Toolbar */}
        <div className="appt-toolbar">
          <div className="appt-seg">
            <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>
              روز
            </button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>
              هفته
            </button>
          </div>

          <div className="appt-nav">
            <button className="icon-action" onClick={() => step(-1)} aria-label="روز قبل">
              <ChevronRightIcon size={20} />
            </button>
            <button className="icon-action" onClick={() => step(1)} aria-label="روز بعد">
              <ChevronLeftIcon size={20} />
            </button>
          </div>

          <div className="appt-search">
            <SearchIcon size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی مشتری یا شماره"
            />
          </div>

          <div className="appt-summary">
            <div>
              <strong>{toPersianNum(summaryCount)}</strong>
              <span>نوبت</span>
            </div>
            <i />
            <div>
              <strong className="green">{toPersianNum(summaryConfirmed)}</strong>
              <span>تأییدشده</span>
            </div>
            <i />
            <div>
              <strong>{formatPrice(summaryRevenue)}</strong>
              <span>درآمد</span>
            </div>
          </div>

          <button className="btn-primary btn-sm appt-new" onClick={() => showToast('افزودن نوبت از پنل آرایشگر به‌زودی اضافه می‌شود')}>
            <PlusIcon size={16} /> نوبت جدید
          </button>
        </div>

        {/* Day strip */}
        <div className="appt-strip">
          {days.map((d, i) => {
            const count = (byDate.get(d.iso) ?? []).filter((a) => a.status !== 'c').length;
            const active = view === 'day' && selected === i;
            return (
              <button
                key={d.iso}
                className={`appt-chip ${active ? 'active' : ''}`}
                onClick={() => {
                  setView('day');
                  setSelected(i);
                }}
              >
                <span className="dow">{d.weekdayLabel}</span>
                <span className="dom">{d.dayNum}</span>
                <span className="cnt">{count ? `${toPersianNum(count)} نوبت` : '—'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {groups.length === 0 || groups.every((g) => g.items.length === 0) ? (
        <div className="dash-card dash-empty">
          <CalendarIcon size={48} strokeWidth={1.5} />
          <h3>نوبتی ثبت نشده</h3>
          <p>برای این بازه هنوز نوبتی رزرو نشده است.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="appt-group">
            {group.showHeader && (
              <div className="appt-group-head">
                <strong>{group.day.weekdayLabel}</strong>
                <span>
                  {group.day.dayNum} {group.day.monthLabel}
                </span>
                <hr />
              </div>
            )}

            <div className="appt-list">
              {group.items.map((a) => {
                const s = STATUS[a.status];
                const cancelled = a.status === 'c';
                return (
                  <div key={a.id} className="appt-row" style={{ opacity: cancelled ? 0.6 : 1 }}>
                    <div className="appt-time">
                      <strong>{timeLabel(a.startTime)}</strong>
                      <span>{toPersianNum(a.durationMinutes)} دقیقه</span>
                    </div>
                    <span className="appt-divider" />

                    <div className="appt-customer">
                      <span className="appt-avatar" style={{ background: a.barberColor || '#E8F7EE' }}>
                        {initials(a.customerName)}
                      </span>
                      <div>
                        <strong>{a.customerName}</strong>
                        <span dir="ltr">{toPersianNum(a.customerPhone)}</span>
                      </div>
                    </div>

                    <div className="appt-service">
                      <div className="name">{a.serviceName}</div>
                      {a.note && <div className="note">{a.note}</div>}
                    </div>

                    <div className="appt-price">{formatPrice(a.price)}</div>

                    <span
                      className="appt-badge"
                      style={{ background: s.bg, color: s.color }}
                    >
                      <i style={{ background: s.dot }} />
                      {s.label}
                    </span>

                    <div className="appt-actions">
                      <a className="icon-action" href={`tel:${a.customerPhone}`} aria-label="تماس">
                        <PhoneIcon size={18} />
                      </a>
                      <a className="icon-action" href={`sms:${a.customerPhone}`} aria-label="پیام">
                        <MessageIcon size={18} />
                      </a>
                      {cancelled ? (
                        <button
                          className="icon-action"
                          onClick={() => setStatus(a, 'r', 'نوبت بازگردانی شد')}
                          aria-label="بازگردانی"
                        >
                          <RotateCcwIcon size={18} />
                        </button>
                      ) : (
                        <button
                          className="icon-action danger"
                          onClick={() => setStatus(a, 'c', 'نوبت لغو شد')}
                          aria-label="لغو نوبت"
                        >
                          <XIcon size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
