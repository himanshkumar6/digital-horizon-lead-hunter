'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, Loader2, Sparkles, MapPin, Briefcase, Hash, Filter, CheckSquare, Square, Info } from 'lucide-react';
import { SearchFilters } from '@/types/lead';

interface SearchConsoleProps {
  onSearch: (city: string, niche: string, count: number, filters: SearchFilters) => Promise<void>;
  isLoading: boolean;
  searchStage: string;
  isDemoModeNotice?: string | null;
}

export const SearchConsole: React.FC<SearchConsoleProps> = ({
  onSearch,
  isLoading,
  searchStage,
  isDemoModeNotice,
}) => {
  const [city, setCity] = useState('Ghaziabad');
  const [niche, setNiche] = useState('Jewellery');
  const [leadCount, setLeadCount] = useState<number>(25);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [hasInstagramOnly, setHasInstagramOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [minReviews, setMinReviews] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !niche.trim() || isLoading) return;

    onSearch(city.trim(), niche.trim(), leadCount, {
      noWebsiteOnly,
      hasInstagramOnly,
      minRating: minRating > 0 ? minRating : undefined,
      minReviews: minReviews > 0 ? minReviews : undefined,
    });
  };

  const applyPreset = (presetCity: string, presetNiche: string) => {
    setCity(presetCity);
    setNiche(presetNiche);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-shadow">
      {/* Demo notice banner if active */}
      {isDemoModeNotice && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">Search Provider Notice:</span> {isDemoModeNotice}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-12">
          {/* City Input */}
          <div className="md:col-span-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Target City / Area
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Ghaziabad, Austin, London..."
                disabled={isLoading}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-3.5 pl-10 text-base sm:text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Business Niche */}
          <div className="md:col-span-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Business Category / Niche
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Jewellery, Dental Clinic, Boutique..."
                disabled={isLoading}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-3.5 pl-10 text-base sm:text-sm font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Lead Count */}
          <div className="sm:col-span-1 md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Lead Count
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={leadCount}
                onChange={(e) => setLeadCount(Number(e.target.value))}
                disabled={isLoading}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-2.5 pl-8 text-base sm:text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              >
                <option value={10}>10 Leads</option>
                <option value={20}>20 Leads</option>
                <option value={25}>25 Leads</option>
                <option value={50}>50 Leads</option>
                <option value={100}>100 Leads</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end sm:col-span-1 md:col-span-2">
            <button
              type="submit"
              disabled={isLoading || !city.trim() || !niche.trim()}
              className="flex min-h-[44px] h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Find Leads</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets & Filter Toggle */}
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs text-slate-500">
            <span className="font-medium text-slate-400 shrink-0">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('Ghaziabad', 'Jewellery')}
              className="shrink-0 min-h-[34px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-slate-200 transition-colors"
            >
              Ghaziabad — Jewellery
            </button>
            <button
              type="button"
              onClick={() => applyPreset('Austin', 'Boutique')}
              className="shrink-0 min-h-[34px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-slate-200 transition-colors"
            >
              Austin — Boutique
            </button>
            <button
              type="button"
              onClick={() => applyPreset('Mumbai', 'Dental Clinic')}
              className="shrink-0 min-h-[34px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-slate-200 transition-colors"
            >
              Mumbai — Dental
            </button>
            <button
              type="button"
              onClick={() => applyPreset('London', 'Luxury Spa')}
              className="shrink-0 min-h-[34px] rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-slate-200 transition-colors"
            >
              London — Spa
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showFilters || noWebsiteOnly || hasInstagramOnly || minRating > 0 || minReviews > 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Opportunity Filters</span>
            {(noWebsiteOnly || hasInstagramOnly || minRating > 0 || minReviews > 0) && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 sm:grid-cols-2 md:grid-cols-4">
            {/* Filter: No Website Only */}
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg p-2 select-none hover:bg-white/60 active:bg-white transition-colors">
              <input
                type="checkbox"
                checked={noWebsiteOnly}
                onChange={(e) => setNoWebsiteOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  No Website Only (+40)
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Exclude businesses with existing domains
                </span>
              </div>
            </label>

            {/* Filter: Has Instagram */}
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg p-2 select-none hover:bg-white/60 active:bg-white transition-colors">
              <input
                type="checkbox"
                checked={hasInstagramOnly}
                onChange={(e) => setHasInstagramOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Instagram Found (+25)
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block">
                  Must have active social profile to convert
                </span>
              </div>
            </label>

            {/* Minimum Rating */}
            <div className="p-1">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Minimum Rating: {minRating > 0 ? `${minRating} ★` : 'Any'}
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>Any rating</option>
                <option value={3.5}>3.5+ Stars</option>
                <option value={4.0}>4.0+ Stars (+5 pts)</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Minimum Reviews */}
            <div className="p-1">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Minimum Reviews: {minReviews > 0 ? `${minReviews}+` : 'Any'}
              </label>
              <select
                value={minReviews}
                onChange={(e) => setMinReviews(Number(e.target.value))}
                className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>Any reviews</option>
                <option value={10}>10+ Reviews</option>
                <option value={50}>50+ Reviews (+5 pts)</option>
                <option value={100}>100+ Reviews (+10 pts)</option>
              </select>
            </div>
          </div>
        )}

        {/* Live Search Stage Progress Indicator */}
        {isLoading && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
                  <span>Lead Discovery Pipeline Active</span>
                  <span className="text-[11px] font-normal text-emerald-700">Real-time processing</span>
                </div>
                <div className="mt-1 text-xs text-emerald-800 font-medium">
                  {searchStage || 'Contacting search engine...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
