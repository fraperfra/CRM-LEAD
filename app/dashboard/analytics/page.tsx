"use client";

import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    KPICard,
    calculateConversionRate,
    calculateAvgConversionTime,
    calculateAvgPropertyValue,
    getLeadsBySource,
    getConversionFunnel,
    getLeadsByPropertyType
} from '@/components/analytics/KPICard';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { LeadSourceChart } from '@/components/analytics/LeadSourceChart';
import { PropertyTypeChart } from '@/components/analytics/PropertyTypeChart';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .is('deleted_at', null);

        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const conversionRate = calculateConversionRate(leads);
    const avgConversionTime = calculateAvgConversionTime(leads);
    const avgPropertyValue = calculateAvgPropertyValue(leads);
    const leadsBySource = getLeadsBySource(leads);
    const funnelData = getConversionFunnel(leads);
    const propertyTypeData = getLeadsByPropertyType(leads);

    const topSource = leadsBySource[0]?.name || 'N/A';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1">
                    Analisi dettagliata delle performance del CRM
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Tasso di Conversione"
                    value={`${conversionRate}%`}
                    subtitle="Lead vinti su totali"
                    trend={{ value: 0.5, isPositive: true }}
                    iconName="trending-up"
                    color="green"
                />

                <KPICard
                    title="Tempo Medio Conversione"
                    value={avgConversionTime}
                    subtitle="Giorni dalla creazione"
                    trend={{ value: 2.3, isPositive: false }}
                    iconName="clock"
                    color="blue"
                />

                <KPICard
                    title="Valore Medio Immobile"
                    value={formatCurrency(avgPropertyValue)}
                    subtitle="Media valutazioni"
                    iconName="dollar-sign"
                    color="purple"
                />

                <KPICard
                    title="Principale Fonte Lead"
                    value={topSource || 'N/A'}
                    subtitle="Canale più efficace"
                    iconName="users"
                    color="orange"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="lg:col-span-2">
                    <ConversionFunnel data={funnelData} />
                </div>

                {/* Lead Sources */}
                <LeadSourceChart data={leadsBySource} />

                {/* Property Types */}
                <PropertyTypeChart data={propertyTypeData} />
            </div>

            {/* Performance Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance per Tipologia
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipologia
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Totale Lead
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Vinti
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Conv. Rate
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Valore Medio
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {propertyTypeData.map((type) => {
                                const typeLeads = leads.filter(l =>
                                    (l.tipologia || '').toLowerCase().replace('_', ' ') === type.name.toLowerCase()
                                );
                                const wonLeads = typeLeads.filter(l => l.status === 'vinto').length;
                                const convRate = typeLeads.length > 0
                                    ? ((wonLeads / typeLeads.length) * 100).toFixed(1)
                                    : '0';
                                const avgValue = calculateAvgPropertyValue(
                                    typeLeads.filter((_, idx) => leads.indexOf(_) !== -1)
                                );

                                return (
                                    <tr key={type.name} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {type.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {type.value}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {wonLeads}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {convRate}%
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatCurrency(avgValue)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Export Reports
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Scarica i report di analytics in formato PDF o Excel
                </p>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        📄 Export PDF
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                        📊 Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
}