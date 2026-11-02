import React from 'react';
import { Menu, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onOpenMobileMenu }) => {
  const { organization } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden transition"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-500">Live Inventory Cloud</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Organization Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-900">{organization?.name || 'Organization'}</span>
          <span className="text-[10px] text-slate-400">| Tenant #{organization?.id?.slice(0, 8)}</span>
        </div>
      </div>
    </header>
  );
};
