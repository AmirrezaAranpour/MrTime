import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { StoredAppointment } from '@/lib/appointmentsStore';
import { formatPrice, timeLabel, toPersianNum } from '@/lib/format';
import { CheckIcon } from '@/components/icons';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = (location.state as { appointment?: StoredAppointment } | null)?.appointment;

  if (!appointment) return <Navigate to="/" replace />;

  return (
    <section className="page active">
      <div className="success-wrap">
        <div className="success-icon-ring">
          <div className="success-icon">
            <CheckIcon size={40} strokeWidth={2.5} />
          </div>
        </div>
        <h1>نوبت شما ثبت شد!</h1>
        <p>جزئیات نوبت به شماره موبایل شما پیامک خواهد شد</p>
        <div className="success-card">
          <Row label="آرایشگر" value={appointment.barberName} />
          <Row label="خدمت" value={appointment.serviceName} />
          <Row label="تاریخ" value={appointment.dateLabel} />
          <Row label="ساعت" value={timeLabel(appointment.startTime)} />
          <Row label="مبلغ" value={formatPrice(appointment.price)} accent />
          <Row label="نام" value={appointment.customerName} />
          <Row label="موبایل" value={toPersianNum(appointment.customerPhone)} />
        </div>
        <div className="success-btns">
          <button className="btn-primary" onClick={() => navigate('/appointments')}>
            مشاهده نوبت‌ها
          </button>
          <button className="btn-ghost" onClick={() => navigate('/')}>
            بازگشت به خانه
          </button>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="confirm-row">
      <span className="label">{label}</span>
      <span className="value" style={accent ? { color: 'var(--green)' } : undefined}>
        {value}
      </span>
    </div>
  );
}
