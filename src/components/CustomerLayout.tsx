import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function CustomerLayout() {
  const { pathname } = useLocation();

  // Scroll to top on route change, like the original SPA navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <>
      <Header />
      <main id="app">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
