import { useEffect, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BellIcon, SearchIcon } from './icons';

function Logo() {
  return (
    <Link to="/" className="logo brand-logo">
      <div className="brand-icon">
        <span className="ms ms-filled" style={{ fontSize: 21, color: '#fff' }}>content_cut</span>
      </div>
      <div className="brand-text">
        <div className="brand-name">مسترتایم</div>
        <div className="brand-sub" dir="ltr">MR TIME</div>
      </div>
    </Link>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { isCustomer, user } = useAuth();
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <Logo />

        <div className="header-search hidden-mobile">
          <SearchIcon className="field-icon" size={18} />
          <input
            type="search"
            placeholder="نام آرایشگر یا خدمت..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={submitSearch}
          />
        </div>

        <nav className="header-nav hidden-mobile">
          <Link to="/search">آرایشگران</Link>
          <Link to="/appointments">نوبت‌های من</Link>
        </nav>

        <div className="header-actions">
          <button className="icon-btn" aria-label="اعلان‌ها">
            <BellIcon size={20} />
            <span className="notif-dot" />
          </button>
          <button className="btn-ghost hidden-mobile" onClick={() => navigate('/profile')}>
            {isCustomer && user ? user.phone_number : 'ورود / ثبت‌نام'}
          </button>
        </div>
      </div>
    </header>
  );
}
