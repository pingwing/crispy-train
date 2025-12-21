import { Link, Outlet, useLocation } from 'react-router-dom';

export function AppLayout() {
  const location = useLocation();
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Tiny Inventory</h2>
          <span style={{ color: '#666' }}>Home assignment</span>
        </div>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link
            to="/"
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            Inventory
          </Link>
        </nav>
      </header>
      <main style={{ marginTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
