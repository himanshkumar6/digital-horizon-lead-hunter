'use client';

import React from 'react';
import {
  Compass,
  Database,
  History,
  Settings,
  Sparkles,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export type ActiveTab = 'hunter' | 'saved' | 'history' | 'integrations';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedCount: number;
  hotCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  hotCount,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems = [
    {
      id: 'hunter' as ActiveTab,
      label: 'Lead Hunter',
      icon: Compass,
      description: 'Find local opportunities',
      badge: null,
    },
    {
      id: 'saved' as ActiveTab,
      label: 'Saved CRM Leads',
      icon: Database,
      description: 'Pipeline & outreach',
      badge: savedCount > 0 ? savedCount : null,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Search History',
      icon: History,
      description: 'Audit previous queries',
      badge: null,
    },
    {
      id: 'integrations' as ActiveTab,
      label: 'Integrations & API',
      icon: Settings,
      description: 'Supabase, SerpAPI, AI',
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/90 bg-white shadow-xl md:shadow-none transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 text-sm">
                <span>DIGITAL HORIZON</span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
                Lead Hunter MVP
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpenMobile(false)}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5">
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Workflow
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    className={`group flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50/90 text-emerald-950 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/60 group-hover:text-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="leading-snug">{item.label}</div>
                      </div>
                    </div>

                    {item.badge !== null && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Opportunity Stats Widget */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">Opportunity Target</span>
              <span className="flex h-5 items-center gap-1 rounded-full bg-emerald-600 px-2 text-[10px] font-bold text-white">
                <Flame className="h-3 w-3" />
                HOT
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Prioritizing local businesses with <strong className="text-slate-900">no dedicated website</strong> and active Instagram profiles.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-emerald-200/40 pt-2 text-[11px] text-emerald-800">
              <span>Hot Pipeline Score:</span>
              <span className="font-bold text-emerald-900">80 - 100 pts</span>
            </div>
          </div>
        </div>

        {/* Agency Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-900">Digital Horizon Solutions</div>
              <div className="text-[11px] text-slate-500">Internal Sales Engine</div>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
        </div>
      </aside>
    </>
  );
};
