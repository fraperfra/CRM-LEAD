"use client";

import { useState, useMemo } from 'react';
import { Lead, updateLeadsStatus } from '../../lib/supabase';
import { getLeadQualityColor, getStatusColor, formatDate } from '../../lib/utils';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Download, Layers, CheckSquare, Square, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadsTableProps {
  leads: Lead[];
  onNavigate: (id: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Get unique property types for filter
  const propertyTypes = useMemo(() => {
    const types = new Set(leads.map(l => l.tipologia).filter(Boolean));
    return Array.from(types);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const matchesSearch =
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefono.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesQuality = qualityFilter === 'all' || lead.lead_quality === qualityFilter;
      const matchesType = typeFilter === 'all' || lead.tipologia === typeFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - leadDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === '7' && diffDays > 7) matchesDate = false;
        if (dateFilter === '30' && diffDays > 30) matchesDate = false;
        if (dateFilter === '90' && diffDays > 90) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesQuality && matchesType && matchesDate;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date desc
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [leads, searchTerm, statusFilter, qualityFilter, typeFilter, dateFilter, sortConfig]);

  // Handle Sort
  const requestSort = (key: keyof Lead) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = filteredLeads.map(l => l.id);
      setSelectedIds(new Set(ids));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    await updateLeadsStatus(Array.from(selectedIds), newStatus);
    // In a real app we would revalidate data here
    setIsBulkUpdating(false);
    setSelectedIds(new Set());
    // Trigger a refresh somehow, for demo we rely on parent update or reload
    window.location.reload(); // Simple refresh for demo
  };

  const handleExportCSV = () => {
    // If items selected, export only those. Otherwise export filtered list.
    const leadsToExport = selectedIds.size > 0
      ? leads.filter(l => selectedIds.has(l.id))
      : filteredLeads;

    const headers = ['ID', 'Nome', 'Email', 'Telefono', 'Tipologia', 'Superficie', 'Status', 'Quality', 'Data Creazione'];
    const csvContent = [
      headers.join(','),
      ...leadsToExport.map(lead => [
        lead.id,
        `"${lead.nome}"`,
        lead.email,
        lead.telefono,
        lead.tipologia || '',
        lead.superficie || '',
        lead.status,
        lead.lead_quality,
        lead.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentData = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 relative">
      {/* Filters Bar */}
      <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cerca per nome, email o telefono..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            <Download size={16} />
            Esporta CSV
          </button>
        </div>

        {/* Dropdowns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              value: statusFilter, onChange: setStatusFilter, options: [
                { val: 'all', label: 'Tutti gli Status' },
                { val: 'nuovo', label: 'Nuovo' },
                { val: 'contattato', label: 'Contattato' },
                { val: 'qualificato', label: 'Qualificato' },
                { val: 'in_trattativa', label: 'In Trattativa' },
                { val: 'vinto', label: 'Vinto' },
                { val: 'perso', label: 'Perso' }
              ]
            },
            {
              value: qualityFilter, onChange: setQualityFilter, options: [
                { val: 'all', label: 'Tutte le Quality' },
                { val: 'HOT', label: 'HOT' },
                { val: 'WARM', label: 'WARM' },
                { val: 'COLD', label: 'COLD' }
              ]
            },
            {
              value: typeFilter, onChange: setTypeFilter, options: [
                { val: 'all', label: 'Tutte le Tipologie' },
                ...propertyTypes.map(t => ({ val: t!, label: t! }))
              ]
            },
            {
              value: dateFilter, onChange: setDateFilter, options: [
                { val: 'all', label: 'Qualsiasi Data' },
                { val: '7', label: 'Ultimi 7 giorni' },
                { val: '30', label: 'Ultimi 30 giorni' },
                { val: '90', label: 'Ultimi 3 mesi' }
              ]
            }
          ].map((filter, i) => (
            <div key={i} className="relative">
              <select
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none hover:bg-white transition-colors"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter size={14} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={currentData.length > 0 && currentData.every(l => selectedIds.has(l.id))}
                  />
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('nome')}>
                  <div className="flex items-center gap-1">Nome <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4">Contatti</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('tipologia')}>
                  <div className="flex items-center gap-1">Tipologia <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('punteggio')}>
                  <div className="flex items-center gap-1">Score <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('lead_quality')}>
                  <div className="flex items-center gap-1">Quality <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => requestSort('created_at')}>
                  <div className="flex items-center gap-1">Data <ArrowUpDown size={12} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nessun lead trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                currentData.map((lead, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={lead.id}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedIds.has(lead.id) ? 'bg-blue-50/80' : ''}`}
                    onClick={(e) => {
                      // Avoid navigation if clicking checkbox
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        onNavigate(lead.id)
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.has(lead.id)}
                        onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.nome}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{lead.email}</span>
                        <span className="text-gray-500 text-xs">{lead.telefono}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {lead.tipologia || '-'} <span className="text-xs text-gray-400">({lead.superficie}m²)</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 mr-2">{lead.punteggio}</span>
                        <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(lead.punteggio, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getLeadQualityColor(lead.lead_quality)}`}>
                        {lead.lead_quality}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100/50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Pagina {currentPage} di {totalPages || 1}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 mx-auto w-max max-w-[90vw] z-40 lg:left-64"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-blue-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 border-r border-gray-200 pr-4">
                <div className="bg-blue-600 text-white rounded-md w-6 h-6 flex items-center justify-center text-xs">
                  {selectedIds.size}
                </div>
                Selezionati
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  onChange={(e) => handleBulkStatusChange(e.target.value)}
                  disabled={isBulkUpdating}
                  defaultValue=""
                >
                  <option value="" disabled>Cambia Status...</option>
                  <option value="nuovo">Nuovo</option>
                  <option value="contattato">Contattato</option>
                  <option value="qualificato">Qualificato</option>
                  <option value="in_trattativa">In Trattativa</option>
                  <option value="vinto">Vinto</option>
                  <option value="perso">Perso</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex flex-col items-center gap-0.5"
                  title="Esporta selezionati"
                >
                  <Download size={20} />
                </button>
              </div>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadsTable;