import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authApi, reservationsApi } from '@/api';
import type { AvailableSlot, PublicService } from '@/types/api';
import { barbersApi } from '@/api';
import { useActiveBarbers } from '@/hooks/useActiveBarbers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateDates, fullDateLabel } from '@/lib/dates';
import { formatPrice, timeLabel, toPersianNum } from '@/lib/format';
import { addAppointment, type StoredAppointment } from '@/lib/appointmentsStore';
import ServiceItem from '@/components/ServiceItem';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  MoonIcon,
  ReceiptIcon,
  SunIcon,
  SunriseIcon,
} from '@/components/icons';

type AuthPhase = 'phone' | 'otp';

const STEP_LABELS = ['انتخاب خدمت', 'انتخاب زمان', 'تایید نهایی'];

interface TimeGroup {
  key: string;
  label: string;
  Icon: typeof SunIcon;
  slots: AvailableSlot[];
}

/** Split available slots into morning / noon / evening buckets by hour. */
function groupSlots(slots: AvailableSlot[]): TimeGroup[] {
  const buckets: TimeGroup[] = [
    { key: 'morning', label: 'صبح', Icon: SunriseIcon, slots: [] },
    { key: 'noon', label: 'ظهر', Icon: SunIcon, slots: [] },
    { key: 'evening', label: 'عصر', Icon: MoonIcon, slots: [] },
  ];
  for (const s of slots) {
    const hour = Number(s.start_time.slice(0, 2));
    if (hour < 12) buckets[0].slots.push(s);
    else if (hour < 15) buckets[1].slots.push(s);
    else buckets[2].slots.push(s);
  }
  return buckets.filter((b) => b.slots.length);
}

export default function BookingPage() {
  const { barberId: barberIdParam } = useParams();
  const barberId = Number(barberIdParam);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { isCustomer, user, setAuth } = useAuth();

  const { barbers } = useActiveBarbers();
  const barber = barbers.find((b) => b.id === barberId);

  const [services, setServices] = useState<PublicService[]>([]);
  const initialService = Number(params.get('service')) || null;
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(initialService);
  const [step, setStep] = useState<1 | 2 | 3>(initialService ? 2 : 1);

  const dates = useMemo(() => generateDates(14), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(isCustomer ? user?.name ?? '' : '');
  const [phone, setPhone] = useState(isCustomer ? user?.phone_number ?? '' : '');
  const [note, setNote] = useState('');
  const [authPhase, setAuthPhase] = useState<AuthPhase>('phone');
  const [code, setCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const timeGroups = useMemo(() => groupSlots(slots), [slots]);

  useEffect(() => {
    let active = true;
    barbersApi
      .publicServices(barberId)
      .then((list) => active && setServices(list))
      .catch(() => active && setServices([]));
    return () => {
      active = false;
    };
  }, [barberId]);

  // Fetch real available slots whenever the date/service changes.
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    setSelectedTime(null);
    reservationsApi
      .availableSlots({ barber_id: barberId, service_id: selectedServiceId, date: selectedDate })
      .then((r) => active && setSlots(r.slots))
      .catch(() => active && setSlots([]))
      .finally(() => active && setSlotsLoading(false));
    return () => {
      active = false;
    };
  }, [barberId, selectedServiceId, selectedDate]);

  const goNext = () => {
    if (step === 1) {
      if (!selectedServiceId) return showToast('لطفا یک خدمت انتخاب کنید');
      setStep(2);
    } else if (step === 2) {
      if (!selectedDate) return showToast('لطفا تاریخ را انتخاب کنید');
      if (!selectedTime) return showToast('لطفا ساعت را انتخاب کنید');
      setStep(3);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
    else navigate(-1);
  };

  const scrollStrip = (dir: number) => stripRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  async function createAndGo() {
    const appt = await reservationsApi.createAppointment({
      service_id: selectedServiceId!,
      date: selectedDate!,
      start_time: selectedTime!,
      name: name.trim(),
    });
    const stored: StoredAppointment = {
      id: appt.id,
      barberId,
      barberName: barber?.name ?? '',
      barberInitial: barber?.initial ?? '؟',
      barberColor: barber?.color ?? '#22A45C',
      salon: barber?.salon ?? '',
      serviceName: selectedService?.name ?? '',
      price: appt.service_price ?? String(selectedService?.price ?? ''),
      durationMinutes: selectedService?.duration_minutes ?? 0,
      dateIso: selectedDate!,
      startTime: selectedTime!,
      dateLabel: fullDateLabel(selectedDate!),
      status: appt.last_status,
      customerName: name.trim() || user?.phone_number || '',
      customerPhone: phone || user?.phone_number || '',
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    addAppointment(stored);
    navigate('/success', { state: { appointment: stored } });
  }

  function validate(): boolean {
    if (!name.trim()) {
      showToast('لطفا نام و نام خانوادگی را وارد کنید');
      return false;
    }
    if (isCustomer) return true;
    if (!/^\d{11}$/.test(phone)) {
      showToast('شماره موبایل باید ۱۱ رقم باشد');
      return false;
    }
    if (authPhase === 'otp' && !/^\d{6}$/.test(code)) {
      showToast('کد تایید باید ۶ رقم باشد');
      return false;
    }
    return true;
  }

  async function handlePrimary() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isCustomer) {
        await createAndGo();
      } else if (authPhase === 'phone') {
        const r = await authApi.customerRequestOtp(phone);
        setOtpHint(r.code);
        setAuthPhase('otp');
        showToast('کد تایید ارسال شد');
      } else {
        const res = await authApi.customerVerifyOtp({ phone_number: phone, code, name: name.trim() });
        setAuth({ access: res.access, refresh: res.refresh, user: res.user });
        await createAndGo();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطایی رخ داد');
    } finally {
      setSubmitting(false);
    }
  }

  const primaryLabel = isCustomer
    ? 'تایید و ثبت نوبت'
    : authPhase === 'phone'
      ? 'دریافت کد تایید'
      : 'تایید و ثبت نوبت';

  const ctaEnabled = step === 1 ? !!selectedServiceId : !!selectedDate && !!selectedTime;

  return (
    <section className="page active">
      {/* Title bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}>
          <button className="btn-back" onClick={goBack} aria-label="بازگشت">
            <ChevronRightIcon size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar barber={barber} size={48} />
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em' }}>رزرو نوبت</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                {barber ? `آرایشگر: ${barber.name}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-body">
        {/* Stepper */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 26px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', maxWidth: 560, margin: '0 auto' }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              const on = done || active;
              return (
                <Fragment key={label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 'none', width: 96 }}>
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, border: `2px solid ${on ? 'var(--green)' : 'var(--ink-faint)'}`,
                        background: on ? 'var(--green)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink-muted)',
                      }}
                    >
                      {done ? <CheckIcon size={18} /> : toPersianNum(n)}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 600, color: on ? 'var(--green)' : 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: n < step ? 'var(--green)' : 'var(--ink-faint)', marginTop: 16 }} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' }}>
          <div style={{ flex: '3 1 520px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {step === 1 && (
              <Card>
                <CardHead title="انتخاب خدمت" subtitle="خدمت مورد نظر خود را انتخاب کنید" />
                <div className="services-select-list" style={{ marginTop: 16 }}>
                  {services.map((s) => (
                    <ServiceItem key={s.id} service={s} selected={selectedServiceId === s.id} onSelect={setSelectedServiceId} />
                  ))}
                  {!services.length && <p className="text-muted">خدمتی برای این آرایشگر ثبت نشده است.</p>}
                </div>
              </Card>
            )}

            {step === 2 && (
              <>
                {/* Date */}
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <CardHead title="انتخاب تاریخ" subtitle="روز مورد نظر را انتخاب کنید" />
                    <div style={{ display: 'flex', gap: 7, flex: 'none' }}>
                      <StripBtn onClick={() => scrollStrip(1)} aria="قبلی">
                        <ChevronRightIcon size={20} />
                      </StripBtn>
                      <StripBtn onClick={() => scrollStrip(-1)} aria="بعدی">
                        <ChevronLeftIcon size={20} />
                      </StripBtn>
                    </div>
                  </div>
                  <div
                    ref={stripRef}
                    className="dstrip"
                    style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 2px 6px', scrollBehavior: 'smooth' }}
                  >
                    {dates.map((d) => {
                      const sel = selectedDate === d.iso;
                      return (
                        <button
                          key={d.iso}
                          onClick={() => setSelectedDate(d.iso)}
                          style={{
                            flex: 'none', width: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            padding: '13px 8px', borderRadius: 14, cursor: 'pointer',
                            border: `1.5px solid ${sel ? 'var(--green)' : d.isToday ? '#9fd9b8' : 'var(--border)'}`,
                            background: sel ? 'var(--green)' : 'var(--surface)',
                            color: sel ? '#fff' : 'var(--ink)',
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{d.weekdayLabel}</span>
                          <span style={{ fontSize: 21, fontWeight: 800, lineHeight: 1 }}>{d.dayNum}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: sel ? 'rgba(255,255,255,0.85)' : d.isToday ? 'var(--green)' : 'var(--ink-muted)' }}>
                            {d.monthLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Time */}
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <CardHead
                      title="انتخاب ساعت"
                      subtitle={selectedTime ? `ساعت ${timeLabel(selectedTime)} انتخاب شد` : 'ساعت دلخواه را مشخص کنید'}
                    />
                    <Legend color="var(--green)" label="آزاد" />
                  </div>

                  {!selectedDate ? (
                    <p className="text-muted text-center">ابتدا یک روز را انتخاب کنید</p>
                  ) : slotsLoading ? (
                    <div className="page-loader">
                      <span className="spinner dark" /> در حال بررسی نوبت‌های خالی…
                    </div>
                  ) : timeGroups.length ? (
                    timeGroups.map((g) => (
                      <div key={g.key} style={{ marginTop: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                          <g.Icon size={18} color="var(--ink-muted)" />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-secondary)' }}>{g.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{toPersianNum(g.slots.length)} وقت آزاد</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
                          {g.slots.map((s) => {
                            const sel = selectedTime === s.start_time;
                            return (
                              <button
                                key={s.start_time}
                                onClick={() => setSelectedTime(s.start_time)}
                                style={{
                                  padding: '13px 0', borderRadius: 12, fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
                                  border: `1.5px solid ${sel ? 'var(--green)' : 'var(--ink-faint)'}`,
                                  background: sel ? 'var(--green)' : 'var(--surface)',
                                  color: sel ? '#fff' : 'var(--ink)',
                                }}
                              >
                                {timeLabel(s.start_time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-center">برای این روز نوبت خالی وجود ندارد</p>
                  )}
                </Card>
              </>
            )}

            {step === 3 && (
              <Card>
                <CardHead
                  title="تایید اطلاعات"
                  subtitle={isCustomer ? 'نوبت خود را نهایی کنید' : 'برای ثبت نوبت شماره خود را تایید کنید'}
                />
                <div className="confirm-box" style={{ marginTop: 16 }}>
                  <ConfirmRow label="آرایشگر" value={barber?.name ?? '—'} />
                  <ConfirmRow label="خدمت" value={selectedService?.name ?? '—'} />
                  <ConfirmRow label="تاریخ" value={selectedDate ? fullDateLabel(selectedDate) : '—'} />
                  <ConfirmRow label="ساعت" value={selectedTime ? timeLabel(selectedTime) : '—'} />
                  <ConfirmRow label="مبلغ" value={selectedService ? formatPrice(selectedService.price) : '—'} accent />
                </div>

                <div className="form-grid" style={{ marginTop: 16 }}>
                  <div className="form-field full">
                    <label>نام و نام خانوادگی</label>
                    <input type="text" placeholder="مثال: علی احمدی" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  {isCustomer ? (
                    <p className="text-muted full">
                      وارد شده به عنوان <strong>{toPersianNum(user?.phone_number ?? '')}</strong>
                    </p>
                  ) : (
                    <>
                      <div className="form-field">
                        <label>شماره موبایل</label>
                        <input
                          type="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          maxLength={11}
                          dir="ltr"
                          style={{ textAlign: 'left' }}
                          value={phone}
                          disabled={authPhase === 'otp'}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      {authPhase === 'otp' && (
                        <div className="form-field full">
                          <label>کد تایید</label>
                          <input
                            type="text"
                            placeholder="کد ۶ رقمی"
                            maxLength={6}
                            dir="ltr"
                            style={{ textAlign: 'left' }}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {otpHint && (
                            <p className="field-hint">
                              کد دمو: <strong>{otpHint}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="form-field full">
                    <label>توضیحات (اختیاری)</label>
                    <textarea rows={2} placeholder="توضیحات اضافی برای آرایشگر..." value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                </div>

                <button className="btn-primary btn-block" style={{ marginTop: 16 }} disabled={submitting} onClick={handlePrimary}>
                  {submitting ? <span className="spinner" /> : primaryLabel}
                </button>
              </Card>
            )}
          </div>

          {/* Summary aside */}
          <aside style={{ flex: '1 1 300px', minWidth: 280, maxWidth: 360, position: 'sticky', top: 'calc(var(--header-h) + 16px)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ReceiptIcon size={20} color="var(--green)" />
                <span style={{ fontSize: 16, fontWeight: 800 }}>خلاصه نوبت</span>
              </div>

              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-light)' }}>
                <Avatar barber={barber} size={46} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{barber?.name ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{barber?.specialty ?? barber?.salon ?? ''}</div>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                <SummaryRow label="خدمت" value={selectedService?.name ?? 'انتخاب نشده'} muted={!selectedService} />
                <SummaryRow
                  label="مدت"
                  value={selectedService ? `${toPersianNum(selectedService.duration_minutes)} دقیقه` : '—'}
                  muted={!selectedService}
                />
                <SummaryRow label="تاریخ" value={selectedDate ? fullDateLabel(selectedDate) : 'انتخاب نشده'} muted={!selectedDate} />
                <SummaryRow label="ساعت" value={selectedTime ? timeLabel(selectedTime) : 'انتخاب نشده'} muted={!selectedTime} />
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--ink-secondary)' }}>مبلغ قابل پرداخت</span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{selectedService ? formatPrice(selectedService.price) : '—'}</span>
              </div>

              {step < 3 && (
                <div style={{ padding: '0 20px 20px' }}>
                  <button
                    className="btn-primary btn-block"
                    onClick={goNext}
                    disabled={!ctaEnabled}
                    style={!ctaEnabled ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                  >
                    ادامه
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 11, color: 'var(--ink-muted)' }}>
                    <LockIcon size={15} />
                    <span style={{ fontSize: 11.5 }}>پرداخت پس از تایید آرایشگر</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
      {children}
    </section>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 3 }}>{subtitle}</div>
    </div>
  );
}

function StripBtn({ onClick, aria, children }: { onClick: () => void; aria: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{ width: 38, height: 38, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-secondary)' }}
    >
      {children}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
      <span style={{ width: 11, height: 11, borderRadius: 4, background: color }} />
      <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{label}</span>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: muted ? 'var(--ink-faint)' : 'var(--ink)', textAlign: 'left' }}>{value}</span>
    </div>
  );
}

function ConfirmRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="confirm-row">
      <span className="label">{label}</span>
      <span className="value" style={accent ? { color: 'var(--green)' } : undefined}>
        {value}
      </span>
    </div>
  );
}

function Avatar({ barber, size }: { barber?: { initial: string; color: string }; size: number }) {
  return (
    <div
      style={{
        width: size, height: size, flex: 'none', borderRadius: '50%',
        background: barber?.color ?? 'var(--green-light)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700,
      }}
    >
      {barber?.initial ?? '؟'}
    </div>
  );
}
