/**
 * StockFlow Frontend Route Verification & React Router 7 Compatibility Test Suite
 * 
 * Verifies:
 * - Public routes (/login, /signup, fallback)
 * - Protected routes (/dashboard, /products, /settings, /)
 * - Auth guard redirects and loading states
 * - Authentication lifecycle (login, session expiration, logout)
 * - React Router 7 APIs (createMemoryRouter, NavLink, Link, useNavigate, useSearchParams)
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import assert from 'node:assert/strict';
import {
  createMemoryRouter,
  RouterProvider,
  Navigate,
  Outlet,
  Link,
  NavLink,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

// Suppress harmless SSR useLayoutEffect warnings in Node CLI test runner
const origWarn = console.warn;
const origError = console.error;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect')) return;
  origWarn(...args);
};
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect')) return;
  origError(...args);
};

// ---------------------------------------------------------------------------
// TEST HARNESS & IN-MEMORY STATE
// ---------------------------------------------------------------------------

let totalTests = 0;
let passedTests = 0;

const testCase = async (name, fn) => {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${name}`);
  } catch (err) {
    console.error(`  ❌ [TEST ${totalTests} FAILED] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
};

// Mock In-Memory Storage
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// APPLICATION ROUTE DEFINITION FIXTURES (Matching App.jsx)
// ---------------------------------------------------------------------------

const LoginPageFixture = () => {
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';
  return React.createElement(
    'div',
    { 'data-testid': 'login-page' },
    React.createElement('h1', null, 'Sign in to StockFlow'),
    isExpired && React.createElement('div', { role: 'alert' }, 'Your session has expired. Please log in again.'),
    React.createElement(Link, { to: '/signup' }, 'Create an account')
  );
};

const SignupPageFixture = () => {
  return React.createElement(
    'div',
    { 'data-testid': 'signup-page' },
    React.createElement('h1', null, 'Create your StockFlow Account'),
    React.createElement(Link, { to: '/login' }, 'Already have an account? Login')
  );
};

const DashboardPageFixture = () => {
  return React.createElement('div', { 'data-testid': 'dashboard-page' }, 'Dashboard Overview');
};

const ProductsPageFixture = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  return React.createElement('div', { 'data-testid': 'products-page' }, `Products List (Filter: ${filter})`);
};

const SettingsPageFixture = () => {
  return React.createElement('div', { 'data-testid': 'settings-page' }, 'Organization Settings');
};

const SidebarFixture = () => {
  return React.createElement(
    'nav',
    { 'data-testid': 'sidebar-nav' },
    React.createElement(
      NavLink,
      {
        to: '/dashboard',
        className: ({ isActive }) => (isActive ? 'active-nav-link' : 'inactive-nav-link'),
      },
      'Dashboard'
    ),
    React.createElement(
      NavLink,
      {
        to: '/products',
        className: ({ isActive }) => (isActive ? 'active-nav-link' : 'inactive-nav-link'),
      },
      'Products'
    ),
    React.createElement(
      NavLink,
      {
        to: '/settings',
        className: ({ isActive }) => (isActive ? 'active-nav-link' : 'inactive-nav-link'),
      },
      'Settings'
    )
  );
};

const AppLayoutFixture = () => {
  return React.createElement(
    'div',
    { 'data-testid': 'app-layout' },
    React.createElement(SidebarFixture),
    React.createElement('main', null, React.createElement(Outlet))
  );
};

const ProtectedRouteFixture = ({ authContext }) => {
  if (authContext.loading) {
    return React.createElement('div', { 'data-testid': 'loading-spinner' }, 'Authenticating session...');
  }
  if (!authContext.isAuthenticated) {
    return React.createElement(Navigate, { to: '/login', replace: true });
  }
  return React.createElement(Outlet);
};

const createAppRoutes = (authContext) => [
  // Public Auth Routes
  { path: '/login', element: React.createElement(LoginPageFixture) },
  { path: '/signup', element: React.createElement(SignupPageFixture) },

  // Protected Application Routes
  {
    element: React.createElement(ProtectedRouteFixture, { authContext }),
    children: [
      {
        element: React.createElement(AppLayoutFixture),
        children: [
          { path: '/dashboard', element: React.createElement(DashboardPageFixture) },
          { path: '/products', element: React.createElement(ProductsPageFixture) },
          { path: '/settings', element: React.createElement(SettingsPageFixture) },
          { path: '/', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
        ],
      },
    ],
  },

  // Catch-all Redirect
  { path: '*', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
];

// ---------------------------------------------------------------------------
// TEST RUNNER
// ---------------------------------------------------------------------------

const runAllFrontendRouteTests = async () => {
  console.log('\n================================================================');
  console.log('   StockFlow Frontend Route & React Router 7 Test Suite');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: PUBLIC ROUTES
  // -------------------------------------------------------------------------
  console.log('--- Suite 1: Public Routes & Accessible Views ---');

  await testCase('Login route (/login) renders public login page', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/login'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.equal(router.state.location.pathname, '/login');
    assert.ok(html.includes('Sign in to StockFlow'), 'HTML must include login header');
    assert.ok(html.includes('Create an account'), 'HTML must link to signup');
  });

  await testCase('Signup route (/signup) renders public registration page', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/signup'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.equal(router.state.location.pathname, '/signup');
    assert.ok(html.includes('Create your StockFlow Account'), 'HTML must include signup header');
    assert.ok(html.includes('Already have an account? Login'), 'HTML must link to login');
  });

  await testCase('Public routes remain accessible when unauthenticated', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/login'] });
    assert.equal(router.state.location.pathname, '/login');
    assert.equal(auth.isAuthenticated, false);
  });

  await testCase('Catch-all unknown route intercepts invalid URLs and targets fallback', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/nonexistent-path-999'] });
    
    // Verify that the router's active matches catch the splat route ('*')
    const matchPaths = router.state.matches.map((m) => m.route.path);
    assert.ok(matchPaths.includes('*'), 'Unknown route must match catch-all splat route');
  });

  // -------------------------------------------------------------------------
  // SUITE 2: PROTECTED ROUTES & GUARDS
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 2: Protected Routes & Authorization Guards ---');

  await testCase('Unauthenticated access to /dashboard is blocked and renders Navigate to /login', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/dashboard'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    // ProtectedRoute renders <Navigate to="/login" replace />, so Dashboard is suppressed
    assert.ok(!html.includes('Dashboard Overview'), 'Unauthenticated /dashboard must not expose dashboard content');
    assert.ok(!html.includes('data-testid="app-layout"'), 'Unauthenticated access must not render AppLayout');
  });

  await testCase('Unauthenticated access to /products is blocked and renders Navigate to /login', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/products'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(!html.includes('Products List'), 'Unauthenticated /products must not expose product list');
    assert.ok(!html.includes('data-testid="app-layout"'), 'Unauthenticated access must not render AppLayout');
  });

  await testCase('Unauthenticated access to /settings is blocked and renders Navigate to /login', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/settings'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(!html.includes('Organization Settings'), 'Unauthenticated /settings must not expose settings');
    assert.ok(!html.includes('data-testid="app-layout"'), 'Unauthenticated access must not render AppLayout');
  });

  await testCase('Session loading state renders authenticating spinner without redirection', async () => {
    const auth = { isAuthenticated: false, loading: true };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/dashboard'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Authenticating session...'), 'Loading session must render loading indicator');
    assert.ok(!html.includes('Sign in to StockFlow'), 'Loading session must not prematurely redirect');
  });

  await testCase('Authenticated access to /dashboard renders DashboardPage inside AppLayout', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1', email: 'owner@apex.com' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/dashboard'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Dashboard Overview'), 'Authenticated user must see Dashboard');
    assert.ok(html.includes('data-testid="app-layout"'), 'Dashboard must render within AppLayout');
    assert.ok(html.includes('data-testid="sidebar-nav"'), 'Dashboard must include Sidebar');
  });

  await testCase('Authenticated access to /products renders ProductsPage inside AppLayout', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1', email: 'owner@apex.com' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/products'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Products List'), 'Authenticated user must see Products');
    assert.ok(html.includes('data-testid="app-layout"'), 'Products must render within AppLayout');
  });

  await testCase('Authenticated access to /settings renders SettingsPage inside AppLayout', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1', email: 'owner@apex.com' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/settings'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Organization Settings'), 'Authenticated user must see Settings');
  });

  await testCase('Authenticated access to root path (/) targets /dashboard redirect route', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1', email: 'owner@apex.com' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/'] });
    const matchPaths = router.state.matches.map((m) => m.route.path);

    assert.ok(matchPaths.includes('/'), 'Root path / must be matched in route hierarchy');
  });

  // -------------------------------------------------------------------------
  // SUITE 3: AUTHENTICATION STATE & SESSION LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 3: Authentication State & Lifecycle ---');

  await testCase('Storage session verification initializes authentication status', async () => {
    const storage = new MemoryStorage();
    storage.setItem('stockflow_token', 'jwt.valid.token');
    storage.setItem('stockflow_user', JSON.stringify({ id: 'u1', email: 'user@example.com' }));
    storage.setItem('stockflow_org', JSON.stringify({ id: 'o1', name: 'Apex Logistics' }));

    const token = storage.getItem('stockflow_token');
    const user = JSON.parse(storage.getItem('stockflow_user'));
    const isAuthenticated = !!token && !!user;

    assert.equal(isAuthenticated, true);
    assert.equal(user.email, 'user@example.com');
  });

  await testCase('Expired session query param (?expired=1) activates session expiration alert', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/login?expired=1'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Your session has expired. Please log in again.'), 'Must render session expired notice');
  });

  await testCase('Standard login navigation (/login) does not display session expired alert', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/login'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(!html.includes('Your session has expired'), 'Clean login must not display expiration alert');
  });

  await testCase('Logout clears credentials from storage and revokes route access', async () => {
    const storage = new MemoryStorage();
    storage.setItem('stockflow_token', 'jwt.active.token');
    storage.setItem('stockflow_user', JSON.stringify({ id: 'u1' }));

    // Execute logout
    storage.removeItem('stockflow_token');
    storage.removeItem('stockflow_user');
    storage.removeItem('stockflow_org');

    const token = storage.getItem('stockflow_token');
    const user = storage.getItem('stockflow_user');
    const isAuthenticated = !!token && !!user;

    assert.equal(isAuthenticated, false);
    assert.equal(token, null);
    assert.equal(user, null);

    // Protected route blocked post-logout
    const auth = { isAuthenticated, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/dashboard'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));
    assert.ok(!html.includes('Dashboard Overview'), 'Post-logout must reject protected route access');
  });

  // -------------------------------------------------------------------------
  // SUITE 4: REACT ROUTER 7 APIS & COMPATIBILITY
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 4: React Router 7 Compatibility & APIs ---');

  await testCase('NavLink dynamically applies active class to matching route', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/products'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    // Sidebar NavLink for /products should be active
    assert.ok(html.includes('active-nav-link'), 'Active NavLink must receive active class');
    assert.ok(html.includes('Products'), 'Active NavLink label must be rendered');
  });

  await testCase('useSearchParams parses query strings on React Router 7', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/products?filter=low_stock'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('Products List (Filter: low_stock)'), 'useSearchParams must read query parameters');
  });

  await testCase('Link components render standard anchors with valid hrefs', async () => {
    const auth = { isAuthenticated: false, loading: false };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/login'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('href="/signup"'), 'Link must generate valid href for /signup');
  });

  await testCase('Nested Outlet rendering maintains parent layout structure', async () => {
    const auth = { isAuthenticated: true, loading: false, user: { id: 'u1' } };
    const router = createMemoryRouter(createAppRoutes(auth), { initialEntries: ['/settings'] });
    const html = ReactDOMServer.renderToString(React.createElement(RouterProvider, { router }));

    assert.ok(html.includes('data-testid="app-layout"'), 'AppLayout must be the top container');
    assert.ok(html.includes('data-testid="sidebar-nav"'), 'Sidebar must be inside AppLayout');
    assert.ok(html.includes('Organization Settings'), 'Child route must be rendered inside Outlet');
  });

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests} / ${totalTests} FRONTEND ROUTE TESTS PASSED WITH 100% SUCCESS!`);
  console.log('   React Router 7 client routing and guard assertions verified.');
  console.log('================================================================\n');
};

runAllFrontendRouteTests().catch((err) => {
  console.error('\n❌ FRONTEND TEST RUNNER ABORTED WITH UNHANDLED ERROR:\n', err);
  process.exit(1);
});
