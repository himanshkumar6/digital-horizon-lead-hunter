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
  ArrowUpDown,
} from 'lucide-react';
import { LeadCandidate, Lead } from '@/types/lead';

interface LeadTableProps {
  candidates: (LeadCandidate | Lead)[];
  onSelectLead: (lead: LeadCandidate | Lead) => void;
  onSaveLead: (lead: LeadCandidate) => Promise<void>;
  savedPlaceIds: Set<string>;
  savingPlaceId?: string | null;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  candidates,
  onSelectLead,
  onSaveLead,
  savedPlaceIds,
  savingPlaceId,
}) => {
  const getTemperatureBadge = (temp: 'HOT' | 'WARM' | 'LOW', score: number) => {
    switch (temp) {
      case 'HOT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            <Flame className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
            <span>{score} • HOT</span>
          </span>
        );
      case 'WARM':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-800 border border-yellow-200">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>{score} • WARM</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>{score} • LOW</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <th scope="col" className="py-3.5 pr-3 pl-6">Business</th>
              <th scope="col" className="px-3 py-3.5">Category</th>
              <th scope="col" className="px-3 py-3.5">Rating & Reviews</th>
              <th scope="col" className="px-3 py-3.5">Website</th>
              <th scope="col" className="px-3 py-3.5">Instagram</th>
              <th scope="col" className="px-3 py-3.5">Opportunity Score</th>
              <th scope="col" className="px-3 py-3.5">Reason</th>
              <th scope="col" className="py-3.5 pr-6 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((lead) => {
              const isSaved = savedPlaceIds.has(lead.google_place_id);
              const isSaving = savingPlaceId === lead.google_place_id;

              return (
                <tr
                  key={lead.google_place_id}
                  className="transition-colors hover:bg-slate-50/80 group"
                >
                  {/* Business Name & Address */}
                  <td className="py-3.5 pr-3 pl-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {lead.business_name}
                        </span>
                        {lead.google_maps_url && (
                          <a
                            href={lead.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-600"
                            title="Open in Google Maps"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate max-w-[220px]">{lead.address}</span>
                      </div>
                      {lead.phone && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="h-2.5 w-2.5" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {lead.category}
                    </span>
                  </td>

                  {/* Rating & Reviews */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span className="font-bold text-slate-800 text-xs">{lead.rating}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        ({lead.review_count})
                      </span>
                    </div>
                  </td>

                  {/* Website Status */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {!lead.has_website ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                        <Globe className="h-3 w-3 text-emerald-600" />
                        No Website (+40)
                      </span>
                    ) : (
                      <a
                        href={lead.website || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[120px] truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.website?.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </td>

                  {/* Instagram Status */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {lead.has_instagram && lead.instagram_url ? (
                      <a
                        href={lead.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Instagram className="h-3 w-3 text-purple-600" />
                        <span>Profile (+25)</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not listed</span>
                    )}
                  </td>

                  {/* Opportunity Score & Temperature */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {getTemperatureBadge(lead.lead_temperature, lead.lead_score)}
                  </td>

                  {/* Reason */}
                  <td className="px-3 py-3.5 max-w-[200px]">
                    <p className="text-xs text-slate-600 line-clamp-2" title={lead.opportunity_reason}>
                      {lead.opportunity_reason}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-6 pl-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Pitch & Details</span>
                      </button>

                      <button
                        onClick={() => onSaveLead(lead)}
                        disabled={isSaved || isSaving}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isSaved
                            ? 'bg-slate-100 text-slate-500 cursor-default'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isSaved ? 'Already saved in CRM' : 'Save to CRM pipeline'}
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-3.5 w-3.5 text-slate-500" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
