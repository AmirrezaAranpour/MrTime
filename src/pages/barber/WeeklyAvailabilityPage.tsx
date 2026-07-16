import { useEffect, useMemo, useState } from 'react';
import { availabilityApi } from '@/api';
import type { WeeklyBulkPayload } from '@/types/api';
import { useToast } from '@/context/ToastContext';
import { toPersianNum } from '@/lib/format';
import { apiToMinutes, fmt, minutesToApi, SPAN, STEP, WIN_END, WIN_START } from '@/lib/timeGrid';
import TimeSelect from '@/components/TimeSelect';
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
  MoonIcon,
  PlusIcon,
  RotateCcwIcon,
  TrashIcon,
} from '@/components/icons';

// Project weekday order: 0 = Saturday ... 6 = Friday (matches the backend).
const WEEKDAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

type Range = [number, number]; // [fromMinutes, toMinutes]

interface DayState {
  enabled: boolean;
  ranges: Range[];
}

function emptyDays(): DayState[] {
  return WEEKDAYS.map(() => ({ enabled: false, ranges: [] }));
}

const cloneDays = (days: DayState[]): DayState[] =>
  days.map((d) => ({ enabled: d.enabled, ranges: d.ranges.map((r) => [r[0], r[1]] as Range) }));

function dayMinutes(d: DayState): number {
  if (!d.enabled) return 0;
  return d.ranges.reduce((s, r) => s + Math.max(0, r[1] - r[0]), 0);
}

function hoursLabel(mins: number): string {
  const h = mins / 60;
  const txt = Number.isInteger(h) ? toPersianNum(h) : toPersianNum(h.toFixed(1));
  return `${txt} ساعت`;
}

const TICKS = [6, 9, 12, 15, 18, 21, 24].map((h) => toPersianNum(h));

export default function WeeklyAvailabilityPage() {
  const showToast = useToast();
  const [days, setDays] = useState<DayState[]>(emptyDays);
  const [initial, setInitial] = useState<DayState[]>(emptyDays);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    availabilityApi
      .getWeekly()
      .then((list) => {
        if (!active) return;
        const next = emptyDays();
        for (const item of list) {
          if (item.weekday >= 0 && item.weekday < 7) {
            next[item.weekday].ranges.push([apiToMinutes(item.start_time), apiToMinutes(item.end_time)]);
          }
        }
        next.forEach((d) => {
          d.ranges.sort((a, b) => a[0] - b[0]);
          d.enabled = d.ranges.length > 0;
        });
        setDays(next);
        setInitial(cloneDays(next));
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'خطا در دریافت برنامه'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (fn: (draft: DayState[]) => void) =>
    setDays((prev) => {
      const draft = cloneDays(prev);
      fn(draft);
      return draft;
    });

  const toggleDay = (i: number) =>
    update((d) => {
      d[i].enabled = !d[i].enabled;
      if (d[i].enabled && d[i].ranges.length === 0) d[i].ranges = [[540, 1020]];
    });

  const addRange = (i: number) =>
    update((d) => {
      const rs = d[i].ranges;
      const last = rs.length ? rs[rs.length - 1][1] : 540;
      const from = Math.min(last + STEP, WIN_END - 60);
      rs.push([from, Math.min(from + 120, WIN_END)]);
    });

  const removeRange = (i: number, j: number) =>
    update((d) => {
      d[i].ranges.splice(j, 1);
      if (d[i].ranges.length === 0) d[i].enabled = false;
    });

  const setFrom = (i: number, j: number, v: number) =>
    update((d) => {
      d[i].ranges[j][0] = v;
      if (d[i].ranges[j][1] <= v) d[i].ranges[j][1] = Math.min(v + STEP, WIN_END);
    });

  const setTo = (i: number, j: number, v: number) =>
    update((d) => {
      d[i].ranges[j][1] = v;
      if (d[i].ranges[j][0] >= v) d[i].ranges[j][0] = Math.max(v - STEP, WIN_START);
    });

  const copyToAll = (i: number) =>
    update((d) => {
      const src = d[i];
      d.forEach((day, k) => {
        if (k !== i) {
          day.enabled = src.enabled;
          day.ranges = src.ranges.map((r) => [r[0], r[1]] as Range);
        }
      });
    });

  const openCount = days.filter((d) => d.enabled && d.ranges.length).length;
  const totalMins = days.reduce((s, d) => s + dayMinutes(d), 0);

  async function save() {
    // Each interval must have start < end, and intervals within a day mustn't overlap.
    for (let i = 0; i < days.length; i++) {
      if (!days[i].enabled) continue;
      const sorted = [...days[i].ranges].sort((a, b) => a[0] - b[0]);
      for (let j = 0; j < sorted.length; j++) {
        if (sorted[j][0] >= sorted[j][1]) {
          showToast(`${WEEKDAYS[i]}: ساعت پایان باید بعد از شروع باشد`);
          return;
        }
        if (j > 0 && sorted[j][0] < sorted[j - 1][1]) {
          showToast(`${WEEKDAYS[i]}: بازه‌ها نباید با هم همپوشانی داشته باشند`);
          return;
        }
      }
    }

    // Submit all 7 days so cleared/closed days are removed server-side too.
    const payload: WeeklyBulkPayload = {
      days: days.map((d, weekday) => ({
        weekday,
        intervals:
          d.enabled && d.ranges.length
            ? d.ranges.map((r) => ({ start_time: minutesToApi(r[0]), end_time: minutesToApi(r[1]) }))
            : [],
      })),
    };

    setSaving(true);
    try {
      await availabilityApi.saveWeekly(payload);
      setInitial(cloneDays(days));
      showToast('برنامه هفتگی ذخیره شد');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ذخیره برنامه');
    } finally {
      setSaving(false);
    }
  }

  const timeline = useMemo(
    () =>
      days.map((d) => {
        const open = d.enabled && d.ranges.length > 0;
        return {
          open,
          bars: open
            ? d.ranges.map((r) => ({
                left: `${(((r[0] - WIN_START) / SPAN) * 100).toFixed(2)}%`,
                width: `${(((r[1] - r[0]) / SPAN) * 100).toFixed(2)}%`,
                title: `${fmt(r[0])} تا ${fmt(r[1])}`,
              }))
            : [],
        };
      }),
    [days],
  );

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>برنامه هفتگی</h1>
          <div style={{ fontSize: 13, color: '#9a9a94', marginTop: 6, maxWidth: 540, lineHeight: 1.8 }}>
            ساعات کاری هر روز هفته را مشخص کنید. مشتری فقط بازه‌های فعال را برای رزرو می‌بیند؛ روزهای بدون بازه تعطیل در
            نظر گرفته می‌شوند.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <button
            type="button"
            onClick={() => setDays(cloneDays(initial))}
            disabled={loading || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#56564f',
              border: '1px solid #e6e6e3', borderRadius: 10, padding: '10px 14px', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RotateCcwIcon size={16} /> بازنشانی
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 18px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(22,163,74,0.3)',
            }}
          >
            {saving ? <span className="spinner" /> : <CheckIcon size={16} />} ذخیره تغییرات
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f0faf3', border: '1px solid #d8f0e0', borderRadius: 10, padding: '8px 13px' }}>
          <CheckIcon size={16} color="#16a34a" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toPersianNum(openCount)} روز کاری در هفته</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f6f7f5', border: '1px solid #ececea', borderRadius: 10, padding: '8px 13px' }}>
          <ClockIcon size={16} color="#56564f" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{hoursLabel(totalMins)} در هفته</span>
        </div>
      </div>

      {error && (
        <div className="inline-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="page-loader" style={{ marginTop: 24 }}>
          <span className="spinner dark" /> در حال بارگذاری…
        </div>
      ) : (
        <div
          className="weekly-layout"
          style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 24, alignItems: 'start', marginTop: 24 }}
        >
          {/* EDITOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {days.map((day, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #ececea', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{WEEKDAYS[i]}</span>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
                        color: day.enabled ? '#16a34a' : '#a89c98',
                        background: day.enabled ? '#f0faf3' : '#f3f1f0',
                      }}
                    >
                      {day.enabled ? hoursLabel(dayMinutes(day)) : 'تعطیل'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => copyToAll(i)}
                      title="اعمال این روز به همه"
                      style={{ width: 32, height: 32, border: '1px solid #e6e6e3', background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a7a73' }}
                    >
                      <CopyIcon size={16} />
                    </button>
                    <Switch on={day.enabled} onClick={() => toggleDay(i)} />
                  </div>
                </div>

                {day.enabled ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
                    {day.ranges.map((r, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TimeSelect value={r[0]} onChange={(v) => setFrom(i, j, v)} />
                        <span style={{ fontSize: 13, color: '#9a9a94', flex: 'none' }}>تا</span>
                        <TimeSelect value={r[1]} onChange={(v) => setTo(i, j, v)} />
                        <button
                          type="button"
                          onClick={() => removeRange(i, j)}
                          title="حذف بازه"
                          style={{ width: 38, height: 38, flex: 'none', border: '1px solid #f0dcd9', background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#c98a82' }}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRange(i)}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#16a34a', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 2px' }}
                    >
                      <PlusIcon size={16} /> افزودن بازه
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '11px 13px', background: '#faf7f6', border: '1px dashed #ece6e4', borderRadius: 10, color: '#a89c98' }}>
                    <MoonIcon size={16} />
                    <span style={{ fontSize: 13 }}>این روز تعطیل است — برای مشتری قابل رزرو نیست.</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PREVIEW */}
          <div style={{ position: 'sticky', top: 0, background: '#fff', border: '1px solid #ececea', borderRadius: 14, padding: '18px 18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EyeIcon size={18} color="#16a34a" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>پیش‌نمایش هفته</span>
            </div>
            <div style={{ fontSize: 12, color: '#9a9a94', marginTop: 4 }}>آنچه مشتری هنگام رزرو می‌بیند.</div>

            <div dir="ltr" style={{ marginTop: 18, paddingRight: 64 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#b0b0aa', fontVariantNumeric: 'tabular-nums', marginBottom: 7 }}>
                {TICKS.map((t, k) => (
                  <span key={k}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {timeline.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 54, flex: 'none', fontSize: 12, fontWeight: 600, textAlign: 'left', color: row.open ? '#1c211d' : '#bcbcb5' }}>
                    {WEEKDAYS[i]}
                  </span>
                  <div dir="ltr" style={{ flex: 1, position: 'relative', height: 26, background: '#eceae6', borderRadius: 7, overflow: 'hidden' }}>
                    {row.bars.map((bar, j) => (
                      <div key={j} title={bar.title} style={{ position: 'absolute', top: 0, bottom: 0, left: bar.left, width: bar.width, background: '#16a34a', borderRadius: 5 }} />
                    ))}
                    {!row.open && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#bcbcb5' }}>
                        تعطیل
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0ed' }}>
              <Legend color="#16a34a" label="باز" />
              <Legend color="#eceae6" label="تعطیل" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span
      dir="ltr"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      style={{ width: 42, height: 24, borderRadius: 999, background: on ? '#16a34a' : '#d8d8d3', position: 'relative', cursor: 'pointer', flex: 'none', transition: 'background 0.15s' }}
    >
      <span style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transform: on ? 'translateX(18px)' : 'translateX(0px)', transition: 'transform 0.15s' }} />
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 11.5, color: '#7a7a73' }}>{label}</span>
    </div>
  );
}
