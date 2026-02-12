"use client";

import { useState, useEffect } from 'react';
import { supabase, Lead } from '@/lib/supabase';
import { LeadFilters, FilterValues } from '@/components/leads/LeadFilters';
import LeadsTable from '@/components/leads/LeadsTable';
import MobileLeadCard from '@/components/mobile/MobileLeadCard';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
      setFilteredLeads(data);
    }
    setLoading(false);
  }

  const handleFilterChange = (filters: FilterValues) => {
    let filtered = [...leads];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.nome?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search) ||
          lead.telefono?.toLowerCase().includes(search) ||
          lead.indirizzo?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((lead) => filters.status.includes(lead.status));
    }

    // Quality filter
    if (filters.quality.length > 0) {
      filtered = filtered.filter((lead) => filters.quality.includes(lead.lead_quality));
    }

    // Tipologia filter
    if (filters.tipologia.length > 0) {
      filtered = filtered.filter((lead) =>
        lead.tipologia && filters.tipologia.includes(lead.tipologia)
      );
    }

    setFilteredLeads(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500 mt-1">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead trovato' : 'lead trovati'}
        </p>
      </div>

      {/* Filters */}
      <LeadFilters onFilterChange={handleFilterChange} />

      {/* Desktop: Table View */}
      {!isMobile && <LeadsTable leads={filteredLeads} />}

      {/* Mobile: Card View */}
      {isMobile && (
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nessun lead trovato</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <MobileLeadCard key={lead.id} lead={lead} />
            ))
          )}
        </div>
      )}
    </div>
  );
}