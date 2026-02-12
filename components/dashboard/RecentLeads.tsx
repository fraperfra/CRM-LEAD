"use client";

import Link from 'next/link';
import { formatDate, getLeadQualityColor, getStatusColor } from '@/lib/utils';
import { Lead } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lead Recenti</h3>
        <Link
          href="/dashboard/leads"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Vedi tutti
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nessun lead trovato
          </p>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{lead.nome}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{lead.email}</p>
                  <p className="text-sm text-gray-500">{lead.telefono}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getLeadQualityColor(lead.lead_quality)}`}>
                    {lead.lead_quality}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {formatDate(lead.created_at)}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {lead.punteggio} punti
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}