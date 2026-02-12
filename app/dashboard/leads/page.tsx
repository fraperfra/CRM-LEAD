"use client";

import { useEffect, useState } from 'react';
import LeadsTable from '../../../components/leads/LeadsTable';
import { fetchLeads, Lead } from '../../../lib/supabase';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadsPageProps {
  onNavigate: (path: string) => void;
}

const LeadsPage: React.FC<LeadsPageProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads().then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestione Lead</h1>
          <p className="text-gray-500 mt-1">Visualizza e gestisci tutte le richieste di valutazione.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium active:scale-95">
          <PlusCircle size={18} />
          Nuovo Lead
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          onNavigate={(id) => onNavigate(`/dashboard/leads/${id}`)}
        />
      )}
    </motion.div>
  );
};

export default LeadsPage;