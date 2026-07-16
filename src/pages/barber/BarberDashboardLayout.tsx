import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { BriefcaseIcon, CalendarIcon, ClockIcon, LogOutIcon, ScissorsIcon } from '@/components/icons';
import { toPersianNum } from '@/lib/format';

const NAV = [
  { to: '/barber-panel/appointments', label: 'نوبت‌ها', icon: CalendarIcon },
  { to: '/barber-panel/services', label: 'خدمات', icon: BriefcaseIcon },
  { to: '/barber-panel/availability/weekly', label: 'برنامه هفتگی', icon: ClockIcon },
  { to: '/barber-panel/availability/dates', label: 'تنظیمات روزانه', icon: CalendarIcon },
];

export default function BarberDashboardLayout() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    showToast('خروج موفق');
    navigate('/barber-panel/login');
  };

  return (
    <div className="dash">
      <div className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="logo brand-logo">
            <div className="brand-icon">
              <span className="ms ms-filled" style={{ fontSize: 21, color: '#fff' }}>content_cut</span>
            </div>
            <div className="brand-text">
              <div className="brand-name">مسترتایم</div>
              <div className="brand-sub" dir="ltr">MR TIME</div>
            </div>
          </div>
          <div className="dash-topbar-user">
            <ScissorsIcon size={16} />
            {user ? toPersianNum(user.phone_number) : ''}
          </div>
        </div>
      </div>

      <div className="dash-shell">
        <aside className="dash-sidebar">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
          <button className="dash-nav-item danger" onClick={handleLogout}>
            <LogOutIcon size={19} />
            خروج
          </button>
        </aside>

        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
