"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Trash2, Edit, Plus, Zap } from 'lucide-react';
import Link from 'next/link';

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    trigger_type: string;
    trigger_condition: any;
    actions: any[];
    active: boolean;
    executions_count: number;
    success_count: number;
    created_at: string;
}

export default function AutomationRulesList() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRules();
    }, []);

    async function fetchRules() {
        const { data, error } = await supabase
            .from('automation_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setRules(data);
        }
        setLoading(false);
    }

    async function toggleRule(id: string, currentState: boolean) {
        const { error } = await supabase
            .from('automation_rules')
            .update({ active: !currentState })
            .eq('id', id);

        if (!error) {
            fetchRules();
        }
    }

    async function deleteRule(id: string) {
        if (!confirm('Sei sicuro di voler eliminare questa automazione?')) return;

        const { error } = await supabase
            .from('automation_rules')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchRules();
        }
    }

    const getTriggerLabel = (type: string) => {
        const labels: Record<string, string> = {
            'new_lead': 'Nuovo Lead',
            'status_change': 'Cambio Status',
            'no_activity_x_days': 'Nessuna Attività',
            'quality_change': 'Cambio Quality',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Automazioni</h2>
                    <p className="text-gray-500 mt-1">
                        Gestisci le regole di automazione per i tuoi lead
                    </p>
                </div>
                <Link
                    href="/dashboard/automations/create"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Nuova Automazione
                </Link>
            </div>

            {/* Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">Nessuna automazione configurata</p>
                        <Link
                            href="/dashboard/automations/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Crea Prima Automazione
                        </Link>
                    </div>
                ) : (
                    rules.map((rule) => {
                        const successRate = rule.executions_count > 0
                            ? ((rule.success_count / rule.executions_count) * 100).toFixed(0)
                            : '0';

                        return (
                            <div
                                key={rule.id}
                                className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${rule.active
                                        ? 'border-blue-200 hover:border-blue-300'
                                        : 'border-gray-200 opacity-60'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {rule.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {rule.description}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${rule.active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {rule.active ? 'Attiva' : 'Pausa'}
                                    </div>
                                </div>

                                {/* Trigger */}
                                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-xs font-medium text-purple-700 mb-1">
                                        Trigger
                                    </p>
                                    <p className="text-sm text-purple-900">
                                        {getTriggerLabel(rule.trigger_type)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-600 mb-2">
                                        Azioni ({rule.actions?.length || 0})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {rule.actions?.slice(0, 3).map((action: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                            >
                                                {action.type}
                                            </span>
                                        ))}
                                        {rule.actions?.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                +{rule.actions.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500">Esecuzioni</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {rule.executions_count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Success Rate</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {successRate}%
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleRule(rule.id, rule.active)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                                    >
                                        {rule.active ? (
                                            <>
                                                <Pause className="w-4 h-4" />
                                                Pausa
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Attiva
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href={`/dashboard/automations/${rule.id}`}
                                        className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => deleteRule(rule.id)}
                                        className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
