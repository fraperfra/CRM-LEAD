"use client";

import { useEffect, useState } from 'react';
import { Lead, Activity, fetchLeadById, fetchActivities, updateLead, createActivity } from '../../../../lib/supabase';
import { getLeadQualityColor, getStatusColor, formatDate } from '../../../../lib/utils';
import ActivityTimeline from '../../../../components/leads/ActivityTimeline';
import { Phone, Mail, MessageCircle, ArrowLeft, Building2, MapPin, CalendarClock, Edit2, CheckCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadDetailPageProps {
  leadId: string;
  onNavigate: (path: string) => void;
}

const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ leadId, onNavigate }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'notes'>('info');
  const [loading, setLoading] = useState(true);

  // Local state for edits
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!leadId) return;

    setLoading(true);
    Promise.all([
      fetchLeadById(leadId),
      fetchActivities(leadId)
    ]).then(([leadData, activityData]) => {
      setLead(leadData || null);
      if (leadData) setNote(leadData.note || '');
      setActivities(activityData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    });
  }, [leadId]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsUpdatingStatus(true);
    const updatedLead = await updateLead(leadId, { status: newStatus });
    if (updatedLead) {
      setLead(updatedLead);
    }
    setIsUpdatingStatus(false);
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const updatedLead = await updateLead(leadId, { note });
    if (updatedLead) {
      setLead(updatedLead);
    }
    setIsSavingNote(false);
  };

  const handleAddActivity = async (newActivityData: any) => {
    // Call "Server Action"
    const newActivity = await createActivity({
      ...newActivityData,
      lead_id: leadId
    });
    // Optimistic update or fetch again (here we just unshift)
    setActivities(prev => [newActivity, ...prev]);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!lead) return <div className="p-8 text-center text-red-500">Lead non trovato</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Top Navigation */}
      <button
        onClick={() => onNavigate('/dashboard/leads')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Torna alla lista
      </button>

      {/* Header Card */}
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{lead.nome}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getLeadQualityColor(lead.lead_quality)}`}>
                {lead.lead_quality}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-md"><Mail size={14} className="text-blue-500" /> {lead.email}</span>
              <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-md"><Phone size={14} className="text-green-500" /> {lead.telefono}</span>
              <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-md"><MapPin size={14} className="text-red-500" /> Reggio Emilia</span>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm" title="Chiama">
              <Phone size={20} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors shadow-sm" title="WhatsApp">
              <MessageCircle size={20} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors shadow-sm" title="Email">
              <Mail size={20} />
            </motion.button>
            <div className="ml-2 relative">
              <select
                className={`block w-full pl-3 pr-10 py-2.5 text-base border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm rounded-xl transition-all shadow-sm font-medium ${getStatusColor(lead.status)} ${isUpdatingStatus ? 'opacity-70 cursor-wait' : ''}`}
                value={lead.status}
                onChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <option value="nuovo">Nuovo</option>
                <option value="contattato">Contattato</option>
                <option value="qualificato">Qualificato</option>
                <option value="in_trattativa">In Trattativa</option>
                <option value="vinto">Vinto</option>
                <option value="perso">Perso</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="">
            <nav className="flex space-x-2 bg-white/40 p-1 rounded-xl w-fit">
              {(['info', 'activity', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-all
                    ${activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}
                  `}
                >
                  {tab === 'info' ? 'Informazioni' : tab === 'activity' ? 'Attività' : 'Note'}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60 min-h-[400px]">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Building2 size={16} /> Dati Immobile
                  </h3>
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <dt className="text-sm text-gray-500">Tipologia</dt>
                      <dd className="text-sm font-semibold text-gray-900">{lead.tipologia || '-'}</dd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <dt className="text-sm text-gray-500">Superficie</dt>
                      <dd className="text-sm font-semibold text-gray-900">{lead.superficie} m²</dd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <dt className="text-sm text-gray-500">Locali</dt>
                      <dd className="text-sm font-semibold text-gray-900">{lead.locali || '-'}</dd>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <dt className="text-sm text-gray-500">Bagni</dt>
                      <dd className="text-sm font-semibold text-gray-900">{lead.bagni || '-'}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Award size={16} /> Scoring
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl text-center border border-blue-100">
                    <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">{lead.punteggio}</div>
                    <div className="text-xs text-blue-500 font-bold uppercase tracking-widest">Punteggio Qualità</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-xs text-gray-500">Motivazione</p>
                      <p className="text-sm font-medium text-gray-900">{lead.motivazione || 'Non specificata'}</p>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="text-sm font-medium text-gray-900">{lead.source || 'Facebook Ads'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ActivityTimeline activities={activities} onAddActivity={handleAddActivity} />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                <textarea
                  className="flex-1 w-full border border-gray-200 bg-white/50 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[200px] shadow-inner"
                  placeholder="Scrivi qui le note interne..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                  >
                    {isSavingNote ? 'Salvataggio...' : <><Save size={16} /> Salva Nota</>}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarClock size={16} /> Prossimo Follow-up
            </h3>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                className="flex-1 border border-gray-200 bg-white/50 rounded-xl text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toISOString().slice(0, 16) : ''}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Pianifica la prossima chiamata per mantenere caldo il lead.</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award size={100} />
            </div>
            <h3 className="font-bold text-lg mb-2 relative z-10">Suggerimento AI</h3>
            <p className="text-sm opacity-90 relative z-10 leading-relaxed">
              Questo lead ha un punteggio alto ({lead.punteggio}). Consigliamo di inviare una valutazione preliminare PDF entro 24h per aumentare le chance di conversione.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Icon helper workaround
const Award = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
);

export default LeadDetailPage;