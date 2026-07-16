import { useEffect, useState } from 'react';
import { availabilityApi } from '@/api';
import type { DateAvailability } from '@/types/api';
import { useToast } from '@/context/ToastContext';
import { toPersianNum } from '@/lib/format';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS_FULL,
  JALALI_WEEKDAYS_SHORT,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  jalaliWeekdayColumn,
  parseIso,
  todayJalali,
} from '@/lib/dates';
import { apiToMinutes, fmt, minutesToApi, STEP, WIN_END, WIN_START } from '@/lib/timeGrid';
import TimeSelect from '@/components/TimeSelect';
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InfoIcon,
  PlusIcon,
  RepeatIcon,
  RotateCcwIcon,
  TrashIcon,
  XIcon,
} from '@/components/icons';

type Mode = 'weekly' | 'custom' | 'closed';
type Range = [number, number];

interface Editing {
  mode: Mode;
  ranges: Range[];
  reason: string;
}

interface DateGroup {
  mode: 'custom' | 'closed';
  ranges: Range[];
  reason: string;
  records: DateAvailability[];
}

type WeeklyDefaults = Range[][]; // index 0..6 (Sat..Fri)

const REASONS = ['مرخصی شخصی', 'تعطیل رسمی', 'مناسبت', 'بیماری', 'دوره آموزشی'];

const emptyWeekly = (): WeeklyDefaults => Array.from({ length: 7 }, () => []);

/** Group the flat override list into one entry per date. */
function groupByDate(list: DateAvailability[]): Map<string, DateGroup> {
  const map = new Map<string, DateGroup>();
  for (const rec of list) {
    let g = map.get(rec.date);
    if (!g) {
      g = { mode: 'custom', ranges: [], reason: '', records: [] };
      map.set(rec.date, g);
    }
    g.records.push(rec);
    if (rec.rule_type === 'closed') {
      g.mode = 'closed';
      if (rec.reason) g.reason = rec.reason;
    } else {
      g.ranges.push([apiToMinutes(rec.start_time), apiToMinutes(rec.end_time)]);
    }
  }
  for (const g of map.values()) g.ranges.sort((a, b) => a[0] - b[0]);
  return map;
}

/** Weekly working ranges for the weekday of `iso`. */
function defaultRangesFor(iso: string, weekly: WeeklyDefaults): Range[] {
  const d = parseIso(iso);
  if (!d) return [];
  const col = (d.getDay() + 1) % 7; // 0 = Saturday
  return weekly[col].map((r) => [r[0], r[1]] as Range);
}

function buildEditing(iso: string, groups: Map<string, DateGroup>, weekly: WeeklyDefaults): Editing {
  const grp = groups.get(iso);
  const def = defaultRangesFor(iso, weekly);
  if (grp?.mode === 'closed') {
    return { mode: 'closed', ranges: def.length ? def : [[540, 1020]], reason: grp.reason };
  }
  if (grp?.mode === 'custom') {
    return { mode: 'custom', ranges: grp.ranges.map((r) => [r[0], r[1]] as Range), reason: '' };
  }
  return { mode: 'weekly', ranges: def, reason: '' };
}

function rangesLabel(ranges: Range[]): string {
  if (!ranges.length) return 'تعطیل';
  return ranges.map((r) => `${fmt(r[0])} تا ${fmt(r[1])}`).join('، ');
}

function jalaliDateLabel(iso: string): string {
  const j = isoToJalali(iso);
  if (!j) return iso;
  const col = jalaliWeekdayColumn(j.jy, j.jm, j.jd);
  return `${JALALI_WEEKDAYS_FULL[col]} ${toPersianNum(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${toPersianNum(j.jy)}`;
}

export default function DateAvailabilityPage() {
  const showToast = useToast();
  const [view, setView] = useState(() => {
    const t = todayJalali();
    return { jy: t.jy, jm: t.jm };
  });
  const [selected, setSelected] = useState(() => {
    const t = todayJalali();
    return jalaliToIso(t.jy, t.jm, t.jd);
  });
  const [editing, setEditing] = useState<Editing>({ mode: 'weekly', ranges: [], reason: '' });
  const [weekly, setWeekly] = useState<WeeklyDefaults>(emptyWeekly);
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([availabilityApi.getWeekly(), availabilityApi.listDates()])
      .then(([weeklyList, dateList]) => {
        if (!active) return;
        const w = emptyWeekly();
        for (const item of weeklyList) {
          if (item.weekday >= 0 && item.weekday < 7) {
            w[item.weekday].push([apiToMinutes(item.start_time), apiToMinutes(item.end_time)]);
          }
        }
        w.forEach((r) => r.sort((a, b) => a[0] - b[0]));
        setWeekly(w);
        setDates(dateList);
        const t = todayJalali();
        const iso = jalaliToIso(t.jy, t.jm, t.jd);
        setEditing(buildEditing(iso, groupByDate(dateList), w));
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'خطا در دریافت تنظیمات'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = groupByDate(dates);

  const selectDate = (iso: string) => {
    setSelected(iso);
    setEditing(buildEditing(iso, groups, weekly));
  };

  const stepMonth = (delta: number) =>
    setView((v) => {
      let jy = v.jy;
      let jm = v.jm + delta;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm };
    });

  const goToday = () => {
    const t = todayJalali();
    setView({ jy: t.jy, jm: t.jm });
    selectDate(jalaliToIso(t.jy, t.jm, t.jd));
  };

  const editUpdate = (fn: (draft: Editing) => void) =>
    setEditing((prev) => {
      const draft: Editing = { ...prev, ranges: prev.ranges.map((r) => [r[0], r[1]] as Range) };
      fn(draft);
      return draft;
    });

  const setMode = (m: Mode) =>
    editUpdate((e) => {
      e.mode = m;
      if (m === 'custom' && e.ranges.length === 0) e.ranges = [[540, 1020]];
    });

  const addRange = () =>
    editUpdate((e) => {
      const last = e.ranges.length ? e.ranges[e.ranges.length - 1][1] : 540;
      const from = Math.min(last + STEP, WIN_END - 60);
      e.ranges.push([from, Math.min(from + 120, WIN_END)]);
    });

  const removeRange = (j: number) => editUpdate((e) => e.ranges.splice(j, 1));

  const setFrom = (j: number, v: number) =>
    editUpdate((e) => {
      e.ranges[j][0] = v;
      if (e.ranges[j][1] <= v) e.ranges[j][1] = Math.min(v + STEP, WIN_END);
    });

  const setTo = (j: number, v: number) =>
    editUpdate((e) => {
      e.ranges[j][1] = v;
      if (e.ranges[j][0] >= v) e.ranges[j][0] = Math.max(v - STEP, WIN_START);
    });

  const setReason = (t: string) => editUpdate((e) => (e.reason = t));

  async function persist(iso: string, mode: Mode, ranges: Range[], reason: string) {
    // Replace the whole date: delete existing records, then write the new state.
    const existing = groups.get(iso)?.records ?? [];
    for (const rec of existing) await availabilityApi.deleteDate(rec.id);

    if (mode === 'custom') {
      for (const r of ranges) {
        await availabilityApi.createDate({
          date: iso,
          start_time: minutesToApi(r[0]),
          end_time: minutesToApi(r[1]),
          rule_type: 'open',
        });
      }
    } else if (mode === 'closed') {
      await availabilityApi.createDate({
        date: iso,
        start_time: '00:00',
        end_time: '23:59',
        rule_type: 'closed',
        reason: reason.trim(),
      });
    }
    // mode === 'weekly' => the deletions above are the whole change.

    const fresh = await availabilityApi.listDates();
    setDates(fresh);
    setEditing(buildEditing(iso, groupByDate(fresh), weekly));
  }

  async function save() {
    if (editing.mode === 'custom') {
      const sorted = [...editing.ranges].sort((a, b) => a[0] - b[0]);
      for (let j = 0; j < sorted.length; j++) {
        if (sorted[j][0] >= sorted[j][1]) return showToast('ساعت پایان باید بعد از شروع باشد');
        if (j > 0 && sorted[j][0] < sorted[j - 1][1]) return showToast('بازه‌ها نباید همپوشانی داشته باشند');
      }
      if (!editing.ranges.length) return showToast('حداقل یک بازه اضافه کنید');
    }
    setSaving(true);
    try {
      await persist(selected, editing.mode, editing.ranges, editing.reason);
      showToast('تنظیم روزانه ذخیره شد');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ذخیره تنظیم');
    } finally {
      setSaving(false);
    }
  }

  async function clearDate(iso: string) {
    setSaving(true);
    try {
      const existing = groups.get(iso)?.records ?? [];
      for (const rec of existing) await availabilityApi.deleteDate(rec.id);
      const fresh = await availabilityApi.listDates();
      setDates(fresh);
      if (iso === selected) setEditing(buildEditing(iso, groupByDate(fresh), weekly));
      showToast('استثنا حذف شد');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در حذف استثنا');
    } finally {
      setSaving(false);
    }
  }

  // ----- calendar cells -----
  const todayIso = (() => {
    const t = todayJalali();
    return jalaliToIso(t.jy, t.jm, t.jd);
  })();
  const lead = jalaliWeekdayColumn(view.jy, view.jm, 1);
  const monthLen = jalaliMonthLength(view.jy, view.jm);
  const cells: ({ blank: true } | { blank: false; day: number; iso: string })[] = [];
  for (let b = 0; b < lead; b++) cells.push({ blank: true });
  for (let d = 1; d <= monthLen; d++) cells.push({ blank: false, day: d, iso: jalaliToIso(view.jy, view.jm, d) });

  const defLabel = rangesLabel(defaultRangesFor(selected, weekly));
  const hasException = groups.has(selected);

  // ----- registered list -----
  const exceptionList = Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));

  return (
    <>
      {/* Header */}
      <div className="dash-head" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>تنظیمات روزانه</h1>
        <p style={{ maxWidth: 560, lineHeight: 1.8 }}>
          یک تاریخ را از تقویم انتخاب کنید تا فقط برای همان روز ساعت کاری را تغییر دهید، بازه‌ای اضافه یا حذف کنید، یا آن
          روز را با ذکر دلیل تعطیل کنید.
        </p>
      </div>

      {error && <div className="inline-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="page-loader">
          <span className="spinner dark" /> در حال بارگذاری…
        </div>
      ) : (
        <div className="daily-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>
          {/* CALENDAR */}
          <div style={{ background: '#fff', border: '1px solid #ececea', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  {JALALI_MONTHS[view.jm - 1]} {toPersianNum(view.jy)}
                </span>
                <button
                  type="button"
                  onClick={goToday}
                  style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0faf3', border: '1px solid #d8f0e0', borderRadius: 999, padding: '4px 11px', cursor: 'pointer' }}
                >
                  امروز
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <NavBtn onClick={() => stepMonth(-1)} aria="ماه قبل">
                  <ChevronRightIcon size={20} />
                </NavBtn>
                <NavBtn onClick={() => stepMonth(1)} aria="ماه بعد">
                  <ChevronLeftIcon size={20} />
                </NavBtn>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
              {JALALI_WEEKDAYS_SHORT.map((wd, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9a9a94', paddingBottom: 4 }}>
                  {wd}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
              {cells.map((c, i) =>
                c.blank ? (
                  <div key={i} style={{ height: 54 }} />
                ) : (
                  <DayCell
                    key={i}
                    day={c.day}
                    marker={groups.has(c.iso) ? (groups.get(c.iso)!.mode === 'closed' ? 'closed' : 'open') : 'none'}
                    selected={c.iso === selected}
                    today={c.iso === todayIso}
                    onClick={() => selectDate(c.iso)}
                  />
                ),
              )}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 16, borderTop: '1px solid #f0f0ed' }}>
              <LegendDot color="#16a34a" label="ساعت سفارشی" />
              <LegendDot color="#dc2626" label="تعطیل" />
              <LegendDot ring label="امروز" />
            </div>
          </div>

          {/* RIGHT: editor + list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* EDITOR */}
            <div style={{ background: '#fff', border: '1px solid #ececea', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <CalendarIcon size={20} color="#16a34a" />
                <span style={{ fontSize: 16, fontWeight: 700 }}>{jalaliDateLabel(selected)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#9a9a94', marginTop: 5 }}>
                ساعت پیش‌فرض هفتگی: <span style={{ color: '#56564f', fontWeight: 600 }}>{defLabel}</span>
              </div>

              {/* mode segmented */}
              <div style={{ display: 'flex', background: '#f0f0ed', borderRadius: 11, padding: 3, marginTop: 16 }}>
                <SegBtn active={editing.mode === 'weekly'} onClick={() => setMode('weekly')}>طبق هفتگی</SegBtn>
                <SegBtn active={editing.mode === 'custom'} onClick={() => setMode('custom')}>ساعت سفارشی</SegBtn>
                <SegBtn active={editing.mode === 'closed'} onClick={() => setMode('closed')}>تعطیل</SegBtn>
              </div>

              {editing.mode === 'weekly' && (
                <div style={{ marginTop: 16, padding: 14, background: '#f8f9f7', border: '1px solid #eef0ec', borderRadius: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#56564f' }}>
                    <RepeatIcon size={18} color="#9a9a94" />
                    <span style={{ fontSize: 13 }}>این روز طبق برنامه هفتگی پیش می‌رود.</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: '#1c211d' }}>{defLabel}</div>
                </div>
              )}

              {editing.mode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
                  {editing.ranges.map((r, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <TimeSelect value={r[0]} onChange={(v) => setFrom(j, v)} />
                      <span style={{ fontSize: 12, color: '#9a9a94', flex: 'none' }}>تا</span>
                      <TimeSelect value={r[1]} onChange={(v) => setTo(j, v)} />
                      <button
                        type="button"
                        onClick={() => removeRange(j)}
                        title="حذف بازه"
                        style={{ width: 36, height: 36, flex: 'none', border: '1px solid #f0dcd9', background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#c98a82' }}
                      >
                        <TrashIcon size={17} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRange}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#16a34a', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 2px' }}
                  >
                    <PlusIcon size={18} /> افزودن بازه
                  </button>
                  <div style={{ fontSize: 11.5, color: '#a8a89f', lineHeight: 1.7 }}>
                    فقط برای این تاریخ اعمال می‌شود؛ برنامه هفتگی تغییر نمی‌کند.
                  </div>
                </div>
              )}

              {editing.mode === 'closed' && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#56564f', marginBottom: 9 }}>دلیل تعطیلی</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 11 }}>
                    {REASONS.map((rc) => {
                      const on = editing.reason === rc;
                      return (
                        <button
                          key={rc}
                          type="button"
                          onClick={() => setReason(rc)}
                          style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, border: `1px solid ${on ? '#16a34a' : '#e6e6e3'}`, background: on ? '#16a34a' : '#f6f7f5', color: on ? '#fff' : '#56564f', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}
                        >
                          {rc}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={editing.reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="توضیح دلخواه (به مشتری نمایش داده می‌شود)…"
                    style={{ width: '100%', minHeight: 74, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, border: '1px solid #e6e6e3', borderRadius: 11, background: '#fff', color: '#1c211d', outline: 'none', resize: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10, padding: '10px 12px', background: '#fdf3f2', border: '1px solid #f7dcd9', borderRadius: 10 }}>
                    <InfoIcon size={17} color="#dc2626" />
                    <span style={{ fontSize: 12, color: '#a35650', lineHeight: 1.7 }}>
                      در این روز هیچ نوبتی قابل رزرو نخواهد بود و این پیام به مشتری نشان داده می‌شود.
                    </span>
                  </div>
                </div>
              )}

              {/* actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? <span className="spinner" /> : <CheckIcon size={18} />}
                  {editing.mode === 'weekly' ? 'ذخیره (طبق هفتگی)' : 'ذخیره تنظیم'}
                </button>
                {hasException && (
                  <button
                    type="button"
                    onClick={() => clearDate(selected)}
                    disabled={saving}
                    title="حذف استثنا"
                    style={{ width: 46, flex: 'none', border: '1px solid #f0dcd9', background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#c0392b' }}
                  >
                    <RotateCcwIcon size={19} />
                  </button>
                )}
              </div>
            </div>

            {/* REGISTERED LIST */}
            <div style={{ background: '#fff', border: '1px solid #ececea', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>تنظیمات ثبت‌شده</span>
                <span style={{ fontSize: 12, color: '#9a9a94' }}>{toPersianNum(exceptionList.length)} مورد</span>
              </div>
              <div style={{ fontSize: 12, color: '#9a9a94', marginBottom: 14 }}>استثناهای تاریخ‌محور روی برنامه هفتگی</div>

              {exceptionList.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {exceptionList.map(([iso, grp]) => {
                    const closed = grp.mode === 'closed';
                    const iconBg = closed ? '#fdf3f2' : '#f0faf3';
                    const iconColor = closed ? '#dc2626' : '#16a34a';
                    return (
                      <div
                        key={iso}
                        onClick={() => {
                          const j = isoToJalali(iso);
                          if (j) setView({ jy: j.jy, jm: j.jm });
                          selectDate(iso);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', border: `1px solid ${iso === selected ? '#cfe9d8' : '#ececea'}`, background: iso === selected ? '#f8faf8' : '#fff', borderRadius: 12, cursor: 'pointer' }}
                      >
                        <div style={{ width: 38, height: 38, flex: 'none', borderRadius: 9, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {closed ? <XIcon size={19} /> : <ClockIcon size={19} />}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{jalaliDateLabel(iso)}</div>
                          <div style={{ fontSize: 12, color: '#8a8a82', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {closed ? grp.reason || 'تعطیل' : rangesLabel(grp.ranges)}
                          </div>
                        </div>
                        <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: iconColor, background: iconBg, padding: '4px 10px', borderRadius: 999 }}>
                          {closed ? 'تعطیل' : 'سفارشی'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDate(iso);
                          }}
                          title="حذف"
                          style={{ width: 32, height: 32, flex: 'none', border: 'none', background: 'transparent', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#b8b8b2' }}
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '34px 0', color: '#c4c4be' }}>
                  <CalendarIcon size={34} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#9a9a94' }}>تنظیم روزانه‌ای ثبت نشده</div>
                  <div style={{ fontSize: 12 }}>برنامه شما طبق ساعات هفتگی پیش می‌رود.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavBtn({ onClick, aria, children }: { onClick: () => void; aria: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      style={{ width: 34, height: 34, border: '1px solid #e6e6e3', background: '#fff', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#56564f' }}
    >
      {children}
    </button>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ flex: 1, border: 'none', borderRadius: 8, padding: '9px 0', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#16a34a' : '#8a8a84', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
    >
      {children}
    </button>
  );
}

function DayCell({
  day,
  marker,
  selected,
  today,
  onClick,
}: {
  day: number;
  marker: 'none' | 'open' | 'closed';
  selected: boolean;
  today: boolean;
  onClick: () => void;
}) {
  let bg = 'transparent';
  let color = '#1c211d';
  let border = 'transparent';
  let dot = 'transparent';
  if (marker === 'closed') {
    bg = '#fdf3f2';
    color = '#b4332a';
    dot = '#dc2626';
  } else if (marker === 'open') {
    bg = '#f0faf3';
    color = '#15803d';
    dot = '#16a34a';
  }
  if (today && !selected) border = '#16a34a';
  if (selected) {
    bg = '#16a34a';
    color = '#fff';
    border = '#16a34a';
    dot = marker === 'none' ? 'transparent' : 'rgba(255,255,255,0.85)';
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 54, border: `1px solid ${border}`, background: bg, color, borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: selected || today ? 700 : 500 }}
    >
      <span>{toPersianNum(day)}</span>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
    </button>
  );
}

function LegendDot({ color, ring, label }: { color?: string; ring?: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {ring ? (
        <span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid #16a34a' }} />
      ) : (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      )}
      <span style={{ fontSize: 11.5, color: '#7a7a73' }}>{label}</span>
    </div>
  );
}
