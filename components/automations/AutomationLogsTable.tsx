import { useState, useMemo } from 'react';
import { AutomationLog } from '../../lib/supabase';
import { formatDate, getAutomationLogStatusColor, getTriggerTypeLabel } from '../../lib/utils';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomationLogsTableProps {
  logs: AutomationLog[];
}

const statusIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={14} className="text-green-600" />,
  partial: <Clock size={14} className="text-amber-600" />,
  failed: <AlertCircle size={14} className="text-red-600" />,
  running: <Loader2 size={14} className="text-blue-600 animate-spin" />
};

const statusLabels: Record<string, string> = {
  success: 'Completato',
  partial: 'Parziale',
  failed: 'Fallito',
  running: 'In corso'
};

const AutomationLogsTable: React.FC<AutomationLogsTableProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const itemsPerPage = 10;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        log.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.lead_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentData = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cerca per regola o lead..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="relative w-48">
            <select
              className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none hover:bg-white transition-colors"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tutti gli Status</option>
              <option value="success">Completato</option>
              <option value="partial">Parziale</option>
              <option value="failed">Fallito</option>
              <option value="running">In corso</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={14} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Data/Ora</th>
                <th className="px-6 py-4">Regola</th>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Azioni</th>
                <th className="px-6 py-4">Tempo</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nessun log trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                currentData.map((log, i) => (
                  <React.Fragment key={log.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${expandedRow === log.id ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.rule_name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {log.lead_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200">
                          {getTriggerTypeLabel(log.trigger_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getAutomationLogStatusColor(log.status)}`}>
                          {statusIcons[log.status]}
                          {statusLabels[log.status] || log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="font-semibold">{log.actions_executed}</span>
                        <span className="text-gray-400">/{log.actions_total}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {log.execution_time_ms > 0 ? `${(log.execution_time_ms / 1000).toFixed(1)}s` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {expandedRow === log.id ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </td>
                    </motion.tr>

                    {/* Expanded Row */}
                    <AnimatePresence>
                      {expandedRow === log.id && (
                        <tr>
                          <td colSpan={8} className="px-0 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 space-y-2">
                                {log.result_summary && (
                                  <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Riepilogo:</span>
                                    <p className="text-sm text-gray-700 mt-1">{log.result_summary}</p>
                                  </div>
                                )}
                                {log.error_message && (
                                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1">
                                      <AlertCircle size={12} /> Errore:
                                    </span>
                                    <p className="text-sm text-red-700 mt-1">{log.error_message}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100/50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {filteredLogs.length} risultati — Pagina {currentPage} di {totalPages || 1}
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
    </div>
  );
};

export default AutomationLogsTable;
