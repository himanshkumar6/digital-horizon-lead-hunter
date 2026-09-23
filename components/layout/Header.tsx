'use client';

import React from 'react';
import { Menu, Sparkles, Database, Search, ShieldCheck, Flame } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  setIsOpenMobile: (open: boolean) => void;
  integrations?: {
    supabase?: { configured: boolean; statusText: string };
    serpApi?: { configured: boolean; providerName: string };
    ai?: { configured: boolean; providerName: string };
  };
  onOpenIntegrations: () => void;
  onNewSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setIsOpenMobile,
  integrations,
  onOpenIntegrations,
  onNewSearchClick,
}) => {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'hunter':
        return 'Lead Hunter & Prospecting';
      case 'saved':
        return 'Saved Leads & CRM Pipeline';
      case 'history':
        return 'Search Query History';
      case 'integrations':
        return 'API Integrations & Setup';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md sm:h-16 sm:px-6">
      {/* Left: Mobile hamburger & View title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 xs:text-base sm:text-lg max-w-[160px] xs:max-w-[220px] sm:max-w-none">
            {getTabLabel()}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Google Maps & Social lead qualification for website sales
          </p>
        </div>
      </div>

      {/* Right: Live Integration Status Badges & Quick Action */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Quick API Status Trigger Button */}
        <button
          onClick={onOpenIntegrations}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 lg:hidden min-h-[38px]"
          title="View API & Database configuration"
          aria-label="View API status"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              integrations?.serpApi?.configured ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
          <span
            className={`h-2 w-2 rounded-full ${
              integrations?.supabase?.configured ? 'bg-emerald-500' : 'bg-teal-500'
            }`}
          />
          <Sparkles className="h-3 w-3 text-emerald-600" />
          <span className="text-[10px] font-semibold text-slate-600 hidden xs:inline">APIs</span>
        </button>

        {/* Desktop Status Indicators */}
        <button
          onClick={onOpenIntegrations}
          className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 lg:flex"
          title="Click to view API & Database configuration"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                integrations?.serpApi?.configured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-[11px]">
              {integrations?.serpApi?.configured ? 'SerpAPI' : 'Search: Demo'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                integrations?.supabase?.configured ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
            />
            <span className="font-medium text-[11px]">
              {integrations?.supabase?.configured ? 'Supabase' : 'Local DB'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span className="font-medium text-[11px]">
              {integrations?.ai?.configured ? 'Gemini AI' : 'Smart Pitch'}
            </span>
          </div>
        </button>

        {/* New Search CTA button */}
        {activeTab !== 'hunter' && (
          <button
            onClick={onNewSearchClick}
            className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:bg-emerald-800 sm:px-3.5 sm:py-2"
          >
            <Search className="h-3.5 w-3.5" />
            <span>New Search</span>
          </button>
        )}
      </div>
    </header>
  );
};
