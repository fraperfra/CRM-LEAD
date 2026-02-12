"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Clock, CheckCircle2, MoreHorizontal, CalendarClock, AlertCircle } from 'lucide-react';
import { Lead, fetchDueLeads, snoozeLead } from '../../lib/supabase';
import { getLeadQualityColor, formatDate } from '../../lib/utils';

const FollowUpWidget = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchDueLeads();
        // Sort: Overdue first, then by priority
        data.sort((a, b) => {
            const dateA = new Date(a.next_follow_up_date!).getTime();
            const dateB = new Date(b.next_follow_up_date!).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return b.punteggio - a.punteggio;
        });
        setLeads(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSnooze = async (id: string, days: number) => {
        // Optimistic UI update
        setLeads(prev => prev.filter(l => l.id !== id));
        setActiveSnoozeId(null);
        await snoozeLead(id, days);
    };

    const isOverdue = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    if (loading) return (
        <div className="h-64 w-full bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="h-full w-full bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <CalendarClock className="text-blue-600" size={20} />
                    Follow-up Oggi
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{leads.length}</span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {leads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                        <CheckCircle2 size={48} className="text-green-400 mb-2 opacity-50" />
                        <p className="font-medium">Tutto fatto!</p>
                        <p className="text-xs">Nessun follow-up programmato per oggi.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {leads.map((lead) => (
                            <motion.div
                                key={lead.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className={`p-4 rounded-xl border ${isOverdue(lead.next_follow_up_date!) ? 'bg-red-50/50 border-red-100' : 'bg-white/60 border-gray-100'} hover:shadow-md transition-shadow group`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-800">{lead.nome}</h4>
                                            {isOverdue(lead.next_follow_up_date!) && (
                                                <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded gap-1">
                                                    <AlertCircle size={10} /> SCADUTO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getLeadQualityColor(lead.lead_quality)}`}>
                                                {lead.lead_quality}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Phone size={10} /> {lead.telefono}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1">
                                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Chiama">
                                            <Phone size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Email">
                                            <Mail size={16} />
                                        </button>

                                        {/* Snooze Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveSnoozeId(activeSnoozeId === lead.id ? null : lead.id)}
                                                className={`p-2 rounded-lg transition-colors ${activeSnoozeId === lead.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                            >
                                                <Clock size={16} />
                                            </button>

                                            {activeSnoozeId === lead.id && (
                                                <div className="absolute right-0 mt-1 w-40 bg-white shadow-xl rounded-xl border border-gray-100 z-10 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                                                        Rimanda a:
                                                    </div>
                                                    <button onClick={() => handleSnooze(lead.id, 1)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex justify-between">
                                                        Domani <span className="text-xs text-gray-400">1g</span>
                                                    </button>
                                                    <button onClick={() => handleSnooze(lead.id, 3)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex justify-between">
                                                        {lead.lead_quality === 'HOT' ? 'Consigliato' : '3 Giorni'} <span className="text-xs text-gray-400">3g</span>
                                                    </button>
                                                    <button onClick={() => handleSnooze(lead.id, 7)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex justify-between">
                                                        Settimana prox <span className="text-xs text-gray-400">7g</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100/50 flex justify-between items-center text-xs text-gray-400">
                <span>Automazione attiva</span>
                <span className="flex items-center gap-1 text-blue-500 font-medium cursor-pointer hover:underline">
                    Regole Follow-up
                </span>
            </div>
        </div>
    );
};

export default FollowUpWidget;