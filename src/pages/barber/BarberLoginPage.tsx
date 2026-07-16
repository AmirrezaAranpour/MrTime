import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ScissorsIcon } from '@/components/icons';

export default function BarberLoginPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { isBarber, setAuth } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isBarber) return <Navigate to="/barber-panel/services" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{11}$/.test(phone)) return setError('شماره موبایل باید ۱۱ رقم باشد.');
    if (password.length < 8) return setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');

    setBusy(true);
    try {
      if (mode === 'register') {
        await authApi.barberRegister({ phone_number: phone, password, name: name.trim() || undefined });
      }
      const res = await authApi.barberLogin({ phone_number: phone, password });
      setAuth({ access: res.access, refresh: res.refresh, user: res.user });
      showToast(mode === 'register' ? 'ثبت‌نام موفق بود' : 'خوش آمدید');
      navigate('/barber-panel/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-auth-wrap">
      <div className="dash-auth-card">
        <div className="auth-icon">
          <ScissorsIcon size={26} />
        </div>
        <h1>پنل آرایشگران</h1>
        <p className="sub">{mode === 'login' ? 'برای مدیریت خدمات و نوبت‌ها وارد شوید' : 'حساب آرایشگری خود را بسازید'}</p>

        {error && <div className="inline-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-field">
            <label>شماره موبایل</label>
            <input
              type="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              maxLength={11}
              dir="ltr"
              style={{ textAlign: 'left' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label>نام نمایشی</label>
              <input type="text" placeholder="مثال: آرایشگاه مدرن علی" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="form-field">
            <label>رمز عبور</label>
            <input
              type="password"
              placeholder="حداقل ۸ کاراکتر"
              dir="ltr"
              style={{ textAlign: 'left' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : mode === 'login' ? 'ورود' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="dash-auth-switch">
          {mode === 'login' ? (
            <>
              حساب ندارید؟{' '}
              <button onClick={() => setMode('register')}>ثبت‌نام آرایشگر</button>
            </>
          ) : (
            <>
              حساب دارید؟ <button onClick={() => setMode('login')}>ورود</button>
            </>
          )}
        </p>
        <p className="dash-auth-switch">
          <Link to="/" className="muted-link">
            ← بازگشت به صفحه مشتریان
          </Link>
        </p>
      </div>
    </div>
  );
}
