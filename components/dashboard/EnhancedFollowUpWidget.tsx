"use client";

import { useState, useEffect } from 'react';
import { supabase, Lead } from '@/lib/supabase';
import { Phone, Mail, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function EnhancedFollowUpWidget() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowUpLeads();
    }, []);

    async function fetchFollowUpLeads() {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .is('deleted_at', null)
            .or(`next_follow_up_date.lte.${today},next_follow_up_date.is.null`)
            .order('next_follow_up_date', { ascending: true })
            .limit(10);

        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    }

    const getUrgencyBadge = (lead: Lead) => {
        if (!lead.next_follow_up_date) {
            return { label: 'Da Pianificare', color: 'bg-gray-100 text-gray-700' };
        }

        const followUpDate = new Date(lead.next_follow_up_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        followUpDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: `Scaduto ${Math.abs(diffDays)}g fa`, color: 'bg-red-100 text-red-700' };
        } else if (diffDays === 0) {
            return { label: 'Oggi', color: 'bg-orange-100 text-orange-700' };
        } else if (diffDays === 1) {
            return { label: 'Domani', color: 'bg-yellow-100 text-yellow-700' };
        } else {
            return { label: `Tra ${diffDays}g`, color: 'bg-green-100 text-green-700' };
        }
    };

    const handleSnooze = async (leadId: string, days: number) => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + days);

        const { error } = await supabase
            .from('leads')
            .update({ next_follow_up_date: newDate.toISOString().split('T')[0] })
            .eq('id', leadId);

        if (!error) {
            fetchFollowUpLeads();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const overdueCount = leads.filter(l => {
        if (!l.next_follow_up_date) return false;
        return new Date(l.next_follow_up_date) < new Date();
    }).length;

    const todayCount = leads.filter(l => {
        if (!l.next_follow_up_date) return false;
        const followUpDate = new Date(l.next_follow_up_date).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        return followUpDate === today;
    }).length;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Follow-up Oggi</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {overdueCount} scaduti · {todayCount} da fare oggi
                    </p>
                </div>
                {overdueCount > 0 && (
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {leads.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Nessun follow-up programmato</p>
                    </div>
                ) : (
                    leads.map((lead) => {
                        const urgency = getUrgencyBadge(lead);

                        return (
                            <div
                                key={lead.id}
                                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <Link
                                            href={`/dashboard/leads/${lead.id}`}
                                            className="font-medium text-gray-900 hover:text-blue-600"
                                        >
                                            {lead.nome}
                                        </Link>
                                        <p className="text-sm text-gray-500">{lead.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${urgency.color}`}>
                                        {urgency.label}
                                    </span>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <a
                                        href={`tel:${lead.telefono}`}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                                    >
                                        <Phone className="w-3 h-3" />
                                        Chiama
                                    </a>
                                    <a
                                        href={`mailto:${lead.email}`}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        <Mail className="w-3 h-3" />
                                        Email
                                    </a>
                                    <a
                                        href={`https://wa.me/${lead.telefono.replace(/\s/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        WhatsApp
                                    </a>
                                </div>

                                {/* Snooze Options */}
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">Snooze:</span>
                                    <button
                                        onClick={() => handleSnooze(lead.id, 1)}
                                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                                    >
                                        1g
                                    </button>
                                    <button
                                        onClick={() => handleSnooze(lead.id, 3)}
                                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                                    >
                                        3g
                                    </button>
                                    <button
                                        onClick={() => handleSnooze(lead.id, 7)}
                                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                                    >
                                        1sett
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
