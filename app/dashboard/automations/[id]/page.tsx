"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AutomationLogsViewer from '@/components/automations/AutomationLogsViewer';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import Link from 'next/link';

export default function AutomationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRule();
    }
  }, [id]);

  async function fetchRule() {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setRule(data);
    }
    setLoading(false);
  }

  async function toggleActive() {
    if (!rule) return;

    const { error } = await supabase
      .from('automation_rules')
      .update({ active: !rule.active })
      .eq('id', id);

    if (!error) {
      fetchRule();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Automazione non trovata</p>
        </div>
      </div>
    );
  }

  const successRate = rule.executions_count > 0
    ? ((rule.success_count / rule.executions_count) * 100).toFixed(0)
    : '0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/automations"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rule.name}</h1>
            <p className="text-gray-500 mt-1">{rule.description}</p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${rule.active
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
        >
          {rule.active ? (
            <>
              <Pause className="w-4 h-4" />
              Metti in Pausa
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Attiva
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className={`text-2xl font-bold ${rule.active ? 'text-green-600' : 'text-gray-400'}`}>
            {rule.active ? 'Attiva' : 'In Pausa'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Esecuzioni Totali</p>
          <p className="text-2xl font-bold text-gray-900">{rule.executions_count}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{successRate}%</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Configurazione</h3>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Trigger Type</p>
          <p className="text-sm text-gray-900">{rule.trigger_type}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Azioni ({rule.actions?.length || 0})
          </p>
          <div className="space-y-2">
            {rule.actions?.map((action: any, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  {idx + 1}. {action.type}
                  {action.delay_hours > 0 && ` (dopo ${action.delay_hours}h)`}
                </p>
                {action.template && (
                  <p className="text-xs text-blue-700 mt-1">Template: {action.template}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      <AutomationLogsViewer ruleId={id} />
    </div>
  );
}
