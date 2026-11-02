import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut, 
  Building2, 
  Boxes,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ onCloseMobile }) => {
  const { user, organization, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
      {/* Brand & Organization */}
      <div>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              StockFlow
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SaaS
              </span>
            </h1>
            <p className="text-xs text-slate-400">Inventory Management</p>
          </div>
        </div>

        {/* Current Tenant Banner */}
        <div className="px-4 py-3 mx-3 my-4 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Active Tenant</span>
          </div>
          <div className="font-medium text-white truncate text-sm" title={organization?.name}>
            {organization?.name || 'My Organization'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Isolated Environment</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-slate-800/80 p-4 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="truncate pr-2">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-slate-700/50 hover:border-red-500/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};
