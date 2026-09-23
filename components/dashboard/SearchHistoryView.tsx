'use client';

import React from 'react';
import { History, Search, ArrowRight, MapPin, Briefcase, Calendar, RotateCcw } from 'lucide-react';
import { SearchRecord, LeadCandidate } from '@/types/lead';

interface SearchHistoryViewProps {
  history: SearchRecord[];
  isLoading: boolean;
  onReplaySearch: (city: string, niche: string, count: number) => void;
  onLoadCachedSnapshot?: (candidates: LeadCandidate[], city: string, niche: string) => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  history,
  isLoading,
  onReplaySearch,
  onLoadCachedSnapshot,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Search Audit Trail</h2>
          <p className="text-xs text-slate-500">History of Google Local & Maps lead generation queries</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading search query log...
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <History className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No Search History Yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Queries you run in the Lead Hunter tab will be automatically recorded here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{item.city}</span>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {item.found_count} leads
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{item.niche}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => onReplaySearch(item.city, item.niche, item.requested_count)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:bg-slate-950 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Re-run Query</span>
                </button>

                {item.candidates_snapshot && item.candidates_snapshot.length > 0 && onLoadCachedSnapshot && (
                  <button
                    onClick={() => onLoadCachedSnapshot(item.candidates_snapshot!, item.city, item.niche)}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    title="View cached snapshot leads"
                  >
                    View Leads
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
