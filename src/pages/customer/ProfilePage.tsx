import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, tokenStore } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { toPersianNum } from '@/lib/format';
import Avatar from '@/components/Avatar';
import { BellIcon, CalendarIcon, ChevronRightIcon, LogOutIcon, SettingsIcon, UserIcon } from '@/components/icons';

export default function ProfilePage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { isCustomer, user, setAuth, logout } = useAuth();

  // --- Login / register (phone + OTP only — name is collected at booking) ---
  const [phase, setPhase] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // --- Profile name editing ---
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  const displayName = user?.name?.trim() || (user ? toPersianNum(user.phone_number) : 'کاربر');

  const resetAuth = () => {
    setPhase('phone');
    setCode('');
    setOtpHint(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{11}$/.test(phone)) return showToast('شماره موبایل باید ۱۱ رقم باشد');

    setBusy(true);
    try {
      if (phase === 'phone') {
        const r = await authApi.customerRequestOtp(phone);
        setOtpHint(r.code);
        setPhase('otp');
        showToast('کد تایید ارسال شد');
      } else {
        if (!/^\d{6}$/.test(code)) {
          showToast('کد تایید باید ۶ رقم باشد');
          return;
        }
        const res = await authApi.customerVerifyOtp({ phone_number: phone, code });
        setAuth({ access: res.access, refresh: res.refresh, user: res.user });
        showToast('با موفقیت وارد شدید');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setBusy(false);
    }
  }

  function startEditName() {
    setNameInput(user?.name ?? '');
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return showToast('لطفا نام خود را وارد کنید');

    setSavingName(true);
    try {
      const updated = await authApi.updateCustomerProfile({ name: trimmed });
      // Keep the stored session user in sync so the name shows everywhere.
      const current = tokenStore.get();
      if (current) setAuth({ ...current, user: { ...current.user, name: updated.name } });
      setEditingName(false);
      showToast('نام با موفقیت ذخیره شد');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setSavingName(false);
    }
  }

  function handleLogout() {
    logout();
    resetAuth();
    setPhone('');
    setEditingName(false);
    showToast('خروج موفق');
  }

  return (
    <section className="page active">
      <div className="page-banner">
        <div className="container">
          <h1>حساب من</h1>
          <p>مدیریت حساب کاربری و تنظیمات</p>
        </div>
      </div>

      <div className="container page-body">
        {isCustomer && user ? (
          <>
            <div className="user-card">
              <Avatar initial={displayName.charAt(0)} color="#22A45C" size="avatar-xl" />
              <div>
                <h2>{displayName}</h2>
                <p>{toPersianNum(user.phone_number)}</p>
              </div>
            </div>

            {editingName ? (
              <div className="auth-panel" style={{ marginBottom: 16 }}>
                <div className="form-field">
                  <label>نام و نام خانوادگی</label>
                  <input
                    type="text"
                    placeholder="نام کامل"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary btn-block" disabled={savingName} onClick={saveName}>
                    {savingName ? <span className="spinner" /> : 'ذخیره'}
                  </button>
                  <button
                    className="btn-ghost btn-block"
                    disabled={savingName}
                    onClick={() => setEditingName(false)}
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : null}

            <div className="menu-list">
              <button className="menu-item" onClick={startEditName}>
                <span className="menu-icon">
                  <UserIcon size={20} />
                </span>
                ویرایش نام
                <ChevronLeft />
              </button>
              <button className="menu-item" onClick={() => navigate('/appointments')}>
                <span className="menu-icon">
                  <CalendarIcon size={20} />
                </span>
                نوبت‌های من
                <ChevronLeft />
              </button>
              <button className="menu-item">
                <span className="menu-icon">
                  <BellIcon size={20} />
                </span>
                اعلان‌ها
                <ChevronLeft />
              </button>
              <button className="menu-item">
                <span className="menu-icon">
                  <SettingsIcon size={20} />
                </span>
                تنظیمات
                <ChevronLeft />
              </button>
              <button className="menu-item danger" onClick={handleLogout}>
                <span className="menu-icon">
                  <LogOutIcon size={20} />
                </span>
                خروج از حساب
              </button>
            </div>
          </>
        ) : (
          <div className="auth-panel">
            <div className="auth-panel-head">
              <div className="auth-icon">
                <UserIcon size={28} />
              </div>
              <h2>ورود / ثبت‌نام</h2>
              <p>با شماره موبایل خود وارد شوید؛ اگر حساب نداشته باشید ساخته می‌شود</p>
            </div>

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
                  disabled={phase === 'otp'}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {phase === 'otp' && (
                <div className="form-field">
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

              <button type="submit" className="btn-primary btn-block" disabled={busy}>
                {busy ? <span className="spinner" /> : phase === 'phone' ? 'دریافت کد تایید' : 'تایید و ورود'}
              </button>
            </form>

            <p className="dash-auth-switch">
              آرایشگر هستید؟ <Link to="/barber-panel/login" className="muted-link">ورود به پنل آرایشگر</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChevronLeft() {
  return <ChevronRightIcon className="menu-chevron" size={16} />;
}
