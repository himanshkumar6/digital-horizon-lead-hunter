'use client';

import React from 'react';
import { Compass, Database, History, Settings } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
}) => {
  const tabs = [
    {
      id: 'hunter' as ActiveTab,
      label: 'Hunter',
      icon: Compass,
      badge: null,
    },
    {
      id: 'saved' as ActiveTab,
      label: 'CRM Leads',
      icon: Database,
      badge: savedCount > 0 ? savedCount : null,
    },
    {
      id: 'history' as ActiveTab,
      label: 'History',
      icon: History,
      badge: null,
    },
    {
      id: 'integrations' as ActiveTab,
      label: 'Setup',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 block border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-md md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-4 items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600" />
              )}

              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                {tab.badge !== null && (
                  <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
