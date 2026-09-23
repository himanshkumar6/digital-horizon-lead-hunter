'use client';

import React from 'react';
import { Flame, Globe, Instagram, Database, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';

interface StatsRowProps {
  discoveredCount: number;
  hotCount: number;
  warmCount: number;
  noWebsiteCount: number;
  instagramCount: number;
  savedInCrm: number;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  discoveredCount,
  hotCount,
  warmCount,
  noWebsiteCount,
  instagramCount,
  savedInCrm,
}) => {
  const cards = [
    {
      label: 'Discovered Candidates',
      value: discoveredCount,
      subtext: `${hotCount} Hot, ${warmCount} Warm`,
      icon: TrendingUp,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      badge: 'Active Batch',
    },
    {
      label: 'Hot Opportunities (80-100)',
      value: hotCount,
      subtext: 'High-intent website prospects',
      icon: Flame,
      accent: 'text-amber-700 bg-amber-50 border-amber-100',
      badge: '🔥 Priority',
    },
    {
      label: 'No Dedicated Website',
      value: noWebsiteCount,
      subtext: '+40 pts base qualification',
      icon: Globe,
      accent: 'text-teal-700 bg-teal-50 border-teal-100',
      badge: 'Prime Target',
    },
    {
      label: 'Instagram Available',
      value: instagramCount,
      subtext: 'Active visual audience to convert',
      icon: Instagram,
      accent: 'text-purple-700 bg-purple-50 border-purple-100',
      badge: '+25 pts',
    },
    {
      label: 'Saved in CRM',
      value: savedInCrm,
      subtext: 'Pipeline & follow-ups',
      icon: Database,
      accent: 'text-blue-700 bg-blue-50 border-blue-100',
      badge: 'Lead Bank',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const isLastOnMobile = i === cards.length - 1;

        return (
          <div
            key={i}
            className={`flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs transition-shadow hover:shadow-sm ${
              isLastOnMobile ? 'col-span-2 sm:col-span-1 md:col-span-1' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1">{card.label}</span>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${card.accent}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-slate-500 truncate">{card.subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
