import React from 'react';
import { Lead } from '../../lib/supabase';
import { getLeadQualityColor, getStatusColor, formatDate } from '../../lib/utils';
import { ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecentLeadsProps {
  leads: Lead[];
  onNavigate: (id: string) => void;
}

const RecentLeads: React.FC<RecentLeadsProps> = ({ leads, onNavigate }) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Lead Recenti</h3>
        <button 
          onClick={() => onNavigate('')} // Navigate to list
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-transform hover:translate-x-1"
        >
          Vedi tutti <ArrowRight size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {leads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nessun lead recente</div>
        ) : (
          <div className="divide-y divide-gray-100/50">
            {leads.map((lead, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={lead.id} 
                className="p-4 hover:bg-white/50 transition-colors cursor-pointer group"
                onClick={() => onNavigate(lead.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 shadow-inner">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{lead.nome}</h4>
                      <p className="text-xs text-gray-500">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${getLeadQualityColor(lead.lead_quality)}`}>
                      {lead.lead_quality}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 pl-12">
                   <span className="text-sm text-gray-500 truncate max-w-[150px]">{lead.email}</span>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentLeads;