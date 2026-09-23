'use client';

import React from 'react';
import {
  Flame,
  Globe,
  Instagram,
  MapPin,
  ExternalLink,
  Star,
  Sparkles,
  BookmarkPlus,
  Check,
  Phone,
} from 'lucide-react';
import { LeadCandidate, Lead } from '@/types/lead';

interface LeadCardProps {
  lead: LeadCandidate | Lead;
  onSelect: () => void;
  onSave: () => Promise<void>;
  isSaved: boolean;
  isSaving: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onSelect,
  onSave,
  isSaved,
  isSaving,
}) => {
  const getTemperatureBadge = (temp: 'HOT' | 'WARM' | 'LOW', score: number) => {
    switch (temp) {
      case 'HOT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <Flame className="h-3 w-3 text-amber-600 fill-amber-500" />
            <span>{score} • HOT</span>
          </span>
        );
      case 'WARM':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-800 border border-yellow-200">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            <span>{score} • WARM</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{score} • LOW</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-shadow hover:shadow-md">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base break-words line-clamp-1">{lead.business_name}</h3>
              {lead.google_maps_url && (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors shrink-0"
                  title="View on Google Maps"
                  aria-label="View on Google Maps"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px] sm:text-xs">
                {lead.category}
              </span>
              <span>•</span>
              <div className="flex items-center gap-0.5 text-amber-500 font-semibold text-[11px] sm:text-xs">
                <Star className="h-3 w-3 fill-amber-400 shrink-0" />
                <span>{lead.rating}</span>
                <span className="text-slate-400 font-normal">({lead.review_count})</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">{getTemperatureBadge(lead.lead_temperature, lead.lead_score)}</div>
        </div>

        {/* Address & Phone */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed break-words">{lead.address}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <a href={`tel:${lead.phone}`} className="text-slate-700 hover:text-emerald-700 font-medium hover:underline py-0.5">
                {lead.phone}
              </a>
            </div>
          )}
        </div>

        {/* Opportunity Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {!lead.has_website ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Globe className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>No Website (+40)</span>
            </span>
          ) : (
            <a
              href={lead.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 truncate max-w-[170px] hover:text-slate-900"
            >
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.website?.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {lead.has_instagram && lead.instagram_url ? (
            <a
              href={lead.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-100"
            >
              <Instagram className="h-3 w-3 text-purple-600 shrink-0" />
              <span>Instagram (+25)</span>
            </a>
          ) : null}
        </div>

        {/* Opportunity Summary text */}
        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
          {lead.opportunity_reason}
        </p>
      </div>

      {/* Card Actions (Touch friendly min 44px) */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onSelect}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:bg-emerald-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pitch & Details</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
            isSaved
              ? 'bg-slate-100 text-slate-500'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
          }`}
          title={isSaved ? 'Saved in CRM' : 'Save lead'}
          aria-label={isSaved ? 'Saved in CRM' : 'Save lead'}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="hidden xs:inline">Saved</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4 text-slate-600" />
              <span className="hidden xs:inline">Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
