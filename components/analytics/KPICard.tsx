"use client";

import { TrendingUp, TrendingDown, Clock, DollarSign, Users } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    iconName: 'trending-up' | 'clock' | 'dollar-sign' | 'users';
    color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
};

const iconMap = {
    'trending-up': TrendingUp,
    'clock': Clock,
    'dollar-sign': DollarSign,
    'users': Users,
};

export function KPICard({ title, value, subtitle, trend, iconName, color }: KPICardProps) {
    const Icon = iconMap[iconName];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

// Analytics utility functions
export function calculateConversionRate(leads: any[]) {
    const total = leads.length;
    const won = leads.filter(l => l.status === 'vinto').length;
    return total > 0 ? ((won / total) * 100).toFixed(1) : '0';
}

export function calculateAvgConversionTime(leads: any[]) {
    const wonLeads = leads.filter(l => l.status === 'vinto');
    if (wonLeads.length === 0) return 0;

    const totalDays = wonLeads.reduce((sum, lead) => {
        const created = new Date(lead.created_at);
        const updated = new Date(lead.updated_at);
        const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
    }, 0);

    return Math.round(totalDays / wonLeads.length);
}

export function calculateAvgPropertyValue(leads: any[], tipologia?: string) {
    const filtered = tipologia
        ? leads.filter(l => l.tipologia === tipologia && l.valutazione_stimata)
        : leads.filter(l => l.valutazione_stimata);

    if (filtered.length === 0) return 0;

    const total = filtered.reduce((sum, lead) => sum + (lead.valutazione_stimata || 0), 0);
    return Math.round(total / filtered.length);
}

export function getLeadsBySource(leads: any[]) {
    const sources: Record<string, number> = {};

    leads.forEach(lead => {
        const source = lead.utm_source || lead.source || 'Direct';
        sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

export function getConversionFunnel(leads: any[]) {
    return [
        { stage: 'Nuovo', count: leads.filter(l => l.status === 'nuovo').length },
        { stage: 'Contattato', count: leads.filter(l => l.status === 'contattato').length },
        { stage: 'Qualificato', count: leads.filter(l => l.status === 'qualificato').length },
        { stage: 'In Trattativa', count: leads.filter(l => l.status === 'in_trattativa').length },
        { stage: 'Vinto', count: leads.filter(l => l.status === 'vinto').length },
    ];
}

export function getLeadsByPropertyType(leads: any[]) {
    const types: Record<string, number> = {};

    leads.forEach(lead => {
        const type = lead.tipologia || 'Non specificato';
        types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
        .map(([name, value]) => ({
            name: name.replace('_', ' ').charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
            value
        }))
        .sort((a, b) => b.value - a.value);
}
