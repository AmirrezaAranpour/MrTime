import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, reservationsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { AppointmentStatus, CustomerAppointment } from '@/types/api';
import { dateTimeClockLabel, dateTimeDayLabel } from '@/lib/dates';
import { avatarColor, avatarInitial } from '@/lib/demo';
import Avatar from '@/components/Avatar';
import { CalendarIcon } from '@/components/icons';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  p: 'در انتظار',
  r: 'رزرو شده',
  f: 'انجام شده',
  c: 'لغو شده',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  p: 'pending',
  r: 'reserved',
  f: 'finished',
  c: 'cancelled',
};

// The backend returns English validation details; show a Persian equivalent.
const CANCEL_ERRORS: Record<string, string> = {
  'Appointment is already cancelled.': 'این نوبت قبلاً لغو شده است.',
  'Finished appointments cannot be cancelled.': 'نوبت‌های انجام‌شده قابل لغو نیستند.',
  'Appointments that have already started cannot be cancelled.':
    'نوبت‌هایی که کمتر از یک ساعت تا شروعشان مانده یا شروع شده‌اند، قابل لغو نیستند.',
};

function cancelErrorMessage(err: unknown): string {
  if (err instanceof ApiError && typeof err.message === 'string' && CANCEL_ERRORS[err.message]) {
    return CANCEL_ERRORS[err.message];
  }
  return err instanceof Error && err.message ? err.message : 'لغو نوبت ناموفق بود. دوباره تلاش کنید.';
}

/** Past once it is cancelled, finished, or its start time has passed. */
function isPast(a: CustomerAppointment): boolean {
  if (a.last_status === 'c' || a.last_status === 'f') return true;
  return new Date(a.appointment_time).getTime() <= Date.now();
}

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { isCustomer } = useAuth();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [items, setItems] = useState<CustomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isCustomer) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    reservationsApi
      .myAppointments()
      .then((list) => active && setItems(list))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'خطا در دریافت نوبت‌ها'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isCustomer]);

  const filtered = useMemo(
    () => items.filter((a) => (tab === 'past' ? isPast(a) : !isPast(a))),
    [items, tab],
  );

  const cancel = async (id: number) => {
    setCancellingId(id);
    try {
      const updated = await reservationsApi.cancelAppointment(id);
      setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast('نوبت لغو شد');
    } catch (err) {
      showToast(cancelErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section className="page active">
      <div className="page-banner">
        <div className="container">
          <h1>نوبت‌های من</h1>
          <p>مدیریت نوبت‌های فعال و گذشته</p>
        </div>
      </div>

      <div className="container page-body">
        {!isCustomer ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <CalendarIcon size={64} strokeWidth={1.5} />
            </div>
            <h3>برای مشاهده نوبت‌ها وارد شوید</h3>
            <p>نوبت‌های شما پس از ورود و رزرو در این بخش نمایش داده می‌شوند</p>
            <button className="btn-primary" onClick={() => navigate('/search')}>
              جستجوی آرایشگر
            </button>
          </div>
        ) : (
          <>
            <div className="segmented-control">
              <button className={`segment ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
                فعال
              </button>
              <button className={`segment ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
                گذشته
              </button>
            </div>

            {error && <div className="inline-error">{error}</div>}

            {loading ? (
              <div className="page-loader">
                <span className="spinner dark" /> در حال بارگذاری…
              </div>
            ) : filtered.length ? (
              <div className="appointments-list">
                {filtered.map((a) => (
                  <div key={a.id} className="appointment-card">
                    <div className="apt-header">
                      <div className="apt-header-left">
                        <Avatar initial={avatarInitial(a.barber_name)} color={avatarColor(a.barber)} />
                        <h3>{a.barber_name}</h3>
                      </div>
                      <span className={`status-badge ${STATUS_CLASS[a.last_status]}`}>{STATUS_LABELS[a.last_status]}</span>
                    </div>
                    <div className="apt-grid">
                      <div className="apt-field">
                        <label>خدمت</label>
                        <span>{a.service_name}</span>
                      </div>
                      <div className="apt-field">
                        <label>تاریخ</label>
                        <span>{dateTimeDayLabel(a.appointment_time)}</span>
                      </div>
                      <div className="apt-field">
                        <label>ساعت</label>
                        <span>{dateTimeClockLabel(a.appointment_time)}</span>
                      </div>
                    </div>
                    {a.can_cancel && (
                      <div className="apt-actions">
                        <button
                          className="btn-danger-outline"
                          onClick={() => cancel(a.id)}
                          disabled={cancellingId === a.id}
                        >
                          {cancellingId === a.id ? <span className="spinner dark" /> : 'لغو نوبت'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration">
                  <CalendarIcon size={64} strokeWidth={1.5} />
                </div>
                <h3>نوبتی ثبت نشده</h3>
                <p>{tab === 'active' ? 'نوبت فعالی ندارید' : 'نوبت گذشته‌ای ندارید'}</p>
                <button className="btn-primary" onClick={() => navigate('/search')}>
                  جستجوی آرایشگر
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
