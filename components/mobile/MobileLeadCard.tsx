"use client";

import { Lead } from '@/lib/supabase';
import { Phone, Mail, MessageSquare, MapPin, Euro, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency, getLeadQualityColor, getStatusColor } from '@/lib/utils';

interface MobileLeadCardProps {
    lead: Lead;
}

export default function MobileLeadCard({ lead }: MobileLeadCardProps) {
    const qualityColor = getLeadQualityColor(lead.lead_quality);
    const statusColor = getStatusColor(lead.status);

    return (
        <Link
            href={`/dashboard/leads/${lead.id}`}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow active:bg-gray-50"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{lead.nome}</h3>
                    <p className="text-sm text-gray-500 truncate">{lead.email}</p>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-bold ${qualityColor} ml-2 flex-shrink-0`}>
                    {lead.lead_quality}
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                {lead.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lead.telefono}</span>
                    </div>
                )}

                {lead.indirizzo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lead.indirizzo}</span>
                    </div>
                )}

                {lead.valutazione_stimata && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Euro className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatCurrency(lead.valutazione_stimata)}</span>
                    </div>
                )}

                {lead.created_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(lead.created_at)}</span>
                    </div>
                )}
            </div>

            {/* Status & Score */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${statusColor}`}>
                    {lead.status?.replace('_', ' ').toUpperCase()}
                </div>

                {lead.punteggio !== undefined && lead.punteggio !== null && (
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Score:</span>
                        <span className="text-sm font-bold text-blue-600">{lead.punteggio}</span>
                    </div>
                )}
            </div>

            {/* Quick Actions (visible on tap) */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <a
                    href={`tel:${lead.telefono}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-md text-xs font-medium active:bg-purple-200"
                >
                    <Phone className="w-3 h-3" />
                    <span>Chiama</span>
                </a>
                <a
                    href={`mailto:${lead.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-xs font-medium active:bg-blue-200"
                >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                </a>
                <a
                    href={`https://wa.me/${lead.telefono?.replace(/\s/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-md text-xs font-medium active:bg-green-200"
                >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                </a>
            </div>
        </Link>
    );
}
