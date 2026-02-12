"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AutomationLog {
    id: string;
    rule_id: string;
    lead_id: string;
    executed_at: string;
    status: 'success' | 'failed' | 'pending';
    result: any;
    error_message?: string;
    execution_time_ms?: number;
    rule?: { name: string };
    lead?: { nome: string };
}

export default function AutomationLogsViewer({ ruleId }: { ruleId?: string }) {
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [ruleId]);

    async function fetchLogs() {
        let query = supabase
            .from('automation_logs')
            .select('*, rule:automation_rules(name), lead:leads(nome)')
            .order('executed_at', { ascending: false })
            .limit(50);

        if (ruleId) {
            query = query.eq('rule_id', ruleId);
        }

        const { data, error } = await query;

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <Check className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <X className="w-4 h-4 text-red-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'pending':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Log Esecuzioni ({logs.length})
                </h3>
            </div>

            {logs.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">Nessuna esecuzione registrata</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    {!ruleId && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Automazione
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Lead
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Eseguito il
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tempo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Dettagli
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${getStatusColor(log.status)}`}>
                                                {getStatusIcon(log.status)}
                                                <span className="text-xs font-medium capitalize">
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        {!ruleId && (
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {log.rule?.name || 'N/A'}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            {log.lead_id ? (
                                                <Link
                                                    href={`/dashboard/leads/${log.lead_id}`}
                                                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    {log.lead?.nome || 'Lead'}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-gray-500">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(log.executed_at).toLocaleString('it-IT')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.error_message ? (
                                                <span className="text-xs text-red-600" title={log.error_message}>
                                                    Errore
                                                </span>
                                            ) : log.result ? (
                                                <span className="text-xs text-gray-500">
                                                    {Object.keys(log.result).length} azioni
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
