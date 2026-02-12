"use client";

import { useState, useEffect } from 'react';
import { supabase, Lead } from '@/lib/supabase';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadFilters, FilterValues } from '@/components/leads/LeadFilters';
import { Plus } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
      setFilteredLeads(data || []);
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
          lead.telefono?.includes(search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((lead) => lead.status === filters.status);
    }

    // Quality filter
    if (filters.quality) {
      filtered = filtered.filter((lead) => lead.lead_quality === filters.quality);
    }

    // Tipologia filter
    if (filters.tipologia) {
      filtered = filtered.filter((lead) => lead.tipologia === filters.tipologia);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Gestisci tutti i tuoi lead</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          <Plus className="w-5 h-5" />
          Nuovo Lead
        </button>
      </div>

      {/* Filters */}
      <LeadFilters onFilterChange={handleFilterChange} />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {filteredLeads.length === leads.length ? (
          <span>Mostrando tutti i {leads.length} lead</span>
        ) : (
          <span>
            Mostrando {filteredLeads.length} di {leads.length} lead
          </span>
        )}
      </div>

      {/* Table */}
      <LeadsTable leads={filteredLeads} />
    </div>
  );
}