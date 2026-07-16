import { Link, useLocation } from 'react-router-dom';
import { CalendarIcon, HomeIcon, SearchIcon, UserIcon } from './icons';

const ITEMS = [
  { to: '/', label: 'خانه', icon: HomeIcon, match: (p: string) => p === '/' },
  { to: '/search', label: 'جستجو', icon: SearchIcon, match: (p: string) => p.startsWith('/search') },
  { to: '/appointments', label: 'نوبت‌ها', icon: CalendarIcon, match: (p: string) => p.startsWith('/appointments') },
  { to: '/profile', label: 'حساب من', icon: UserIcon, match: (p: string) => p.startsWith('/profile') },
];

// Hide the bottom nav on focused flows (matches the original behaviour).
const HIDE_PREFIXES = ['/barber/', '/booking', '/success'];

export default function BottomNav() {
  const { pathname } = useLocation();
  if (HIDE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ to, label, icon: Icon, match }) => (
        <Link key={to} to={to} className={`nav-item ${match(pathname) ? 'active' : ''}`}>
          <Icon size={22} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
