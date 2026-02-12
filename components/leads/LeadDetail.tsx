import { Lead } from '@/lib/supabase';
import { getLeadQualityColor, getStatusColor, formatCurrency, formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin, Home, Calendar, DollarSign } from 'lucide-react';

interface LeadDetailProps {
    lead: Lead;
}

export function LeadDetail({ lead }: LeadDetailProps) {
    return (
        <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informazioni di Contatto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <a
                                href={`mailto:${lead.email}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {lead.email}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Telefono</p>
                            <a
                                href={`tel:${lead.telefono}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {lead.telefono}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Indirizzo</p>
                            <p className="text-gray-900">{lead.indirizzo || 'Non specificato'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Data Creazione</p>
                            <p className="text-gray-900">{formatDate(lead.created_at)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Dati Immobile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tipologia</p>
                        <p className="text-gray-900 font-medium capitalize">{lead.tipologia?.replace('_', ' ')}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Superficie</p>
                        <p className="text-gray-900 font-medium">{lead.superficie} m²</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Locali</p>
                        <p className="text-gray-900 font-medium">{lead.locali}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Bagni</p>
                        <p className="text-gray-900 font-medium">{lead.bagni}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Piano</p>
                        <p className="text-gray-900 font-medium">{lead.piano}°</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Ascensore</p>
                        <p className="text-gray-900 font-medium">{lead.ascensore ? 'Sì' : 'No'}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Condizione</p>
                        <p className="text-gray-900 font-medium capitalize">{lead.condizione?.replace('_', ' ')}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500">Classe Energetica</p>
                        <p className="text-gray-900 font-medium">{lead.classe_energetica}</p>
                    </div>

                    {lead.extra && lead.extra.length > 0 && (
                        <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-sm font-medium text-gray-500 mb-2">Extra</p>
                            <div className="flex flex-wrap gap-2">
                                {lead.extra.map((item, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Quality & Scoring */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Punteggio e Qualità
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Quality</p>
                        <span className={`px-3 py-1.5 rounded-md text-sm font-medium border ${getLeadQualityColor(lead.lead_quality)}`}>
                            {lead.lead_quality}
                        </span>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                        <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                        </span>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Punteggio</p>
                        <p className="text-2xl font-bold text-gray-900">{lead.punteggio}/100</p>
                    </div>
                </div>

                {(lead.valutazione_stimata || lead.provvigione_stimata) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                        {lead.valutazione_stimata && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Valutazione Stimata</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(lead.valutazione_stimata)}
                                </p>
                            </div>
                        )}

                        {lead.provvigione_stimata && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Provvigione Stimata</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(lead.provvigione_stimata)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Motivation & Source */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Motivazione e Origine
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Motivazione</p>
                        <p className="text-gray-900">{lead.motivazione}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fonte</p>
                            <p className="text-gray-900">{lead.source}</p>
                        </div>

                        {lead.utm_source && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">UTM Source</p>
                                <p className="text-gray-900">{lead.utm_source}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            {lead.note && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Note</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{lead.note}</p>
                </div>
            )}
        </div>
    );
}
