"use client";

import { useEffect, useState } from 'react';
import { AutomationRule, AutomationLog, fetchAutomationRuleById, fetchAutomationLogs, toggleAutomationRule, deleteAutomationRule, addActionToRule, AutomationAction } from '../../../../lib/supabase';
import { formatDate, getTriggerTypeLabel, cn } from '../../../../lib/utils';
import FlowBuilder from '../../../../components/automations/FlowBuilder';
import AutomationLogsTable from '../../../../components/automations/AutomationLogsTable';
import { ArrowLeft, Zap, Play, Pause, Trash2, Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AutomationDetailPageProps {
  ruleId: string;
  onNavigate: (path: string) => void;
}

const AutomationDetailPage: React.FC<AutomationDetailPageProps> = ({ ruleId, onNavigate }) => {
  const [rule, setRule] = useState<AutomationRule | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'logs'>('flow');

  useEffect(() => {
    if (!ruleId) return;
    setLoading(true);
    Promise.all([
      fetchAutomationRuleById(ruleId),
      fetchAutomationLogs(ruleId)
    ]).then(([ruleData, logsData]) => {
      setRule(ruleData || null);
      setLogs(logsData);
      setLoading(false);
    });
  }, [ruleId]);

  const handleToggle = async () => {
    if (!rule) return;
    setToggling(true);
    const updated = await toggleAutomationRule(rule.id);
    if (updated) setRule(updated);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!rule) return;
    setDeleting(true);
    const success = await deleteAutomationRule(rule.id);
    if (success) {
      onNavigate('/dashboard/automations');
    }
    setDeleting(false);
  };

  const handleAddAction = async (action: Omit<AutomationAction, 'id' | 'order'>) => {
    if (!rule) return;
    const updated = await addActionToRule(rule.id, action);
    if (updated) setRule({ ...updated });
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rule) {
    return <div className="p-8 text-center text-red-500">Automazione non trovata</div>;
  }

  const successRate = rule.executions_count > 0
    ? Math.round((rule.success_count / rule.executions_count) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={() => onNavigate('/dashboard/automations')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
        Torna alle automazioni
      </button>

      {/* Header Card */}
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-xl shadow-md',
              rule.is_active
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                : 'bg-gray-200 text-gray-500'
            )}>
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{rule.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200">
                  {getTriggerTypeLabel(rule.trigger_type)}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold',
                  rule.is_active ? 'text-green-600' : 'text-gray-400'
                )}>
                  {rule.is_active ? <Play size={12} /> : <Pause size={12} />}
                  {rule.is_active ? 'Attiva' : 'Disattivata'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95',
                rule.is_active
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
                toggling && 'opacity-50 cursor-wait'
              )}
            >
              {rule.is_active ? <><Pause size={16} /> Disattiva</> : <><Play size={16} /> Attiva</>}
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all shadow-sm active:scale-95',
                deleting && 'opacity-50 cursor-wait'
              )}
            >
              <Trash2 size={16} />
              Elimina
            </button>
          </div>
        </div>

        {rule.description && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50/80 p-3 rounded-xl">{rule.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Flow / Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <nav className="flex space-x-2 bg-white/40 p-1 rounded-xl w-fit">
            {([
              { key: 'flow', label: 'Pipeline' },
              { key: 'logs', label: 'Log Esecuzioni' }
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60 min-h-[400px]">
            {activeTab === 'flow' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FlowBuilder
                  rule={rule}
                  editable={true}
                  onAddAction={handleAddAction}
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {logs.length > 0 ? (
                  <AutomationLogsTable logs={logs} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Activity size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">Nessun log per questa regola</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Stats Sidebar */}
        <div className="space-y-4">
          {/* Execution Stats */}
          <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-white/60">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={16} /> Statistiche
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                <span className="text-sm text-gray-500">Esecuzioni totali</span>
                <span className="text-sm font-bold text-gray-900">{rule.executions_count}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                <span className="text-sm text-gray-500">Tasso successo</span>
                <span className={cn(
                  'text-sm font-bold',
                  successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {successRate}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                <span className="text-sm text-gray-500">Azioni nella pipeline</span>
                <span className="text-sm font-bold text-gray-900">{rule.actions.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                <span className="text-sm text-gray-500">Ultima esecuzione</span>
                <span className="text-sm font-medium text-gray-700">
                  {rule.last_executed_at ? formatDate(rule.last_executed_at) : 'Mai'}
                </span>
              </div>
            </div>
          </div>

          {/* Success rate visual */}
          <div className={cn(
            'p-5 rounded-2xl shadow-lg text-white relative overflow-hidden',
            successRate >= 90
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : successRate >= 70
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-blue-600 to-indigo-700'
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 size={80} />
            </div>
            <h3 className="font-bold text-lg mb-1 relative z-10">Performance</h3>
            <div className="text-4xl font-extrabold relative z-10 mb-1">{successRate}%</div>
            <p className="text-sm opacity-90 relative z-10">
              {rule.success_count} su {rule.executions_count} esecuzioni riuscite
            </p>
          </div>

          {/* Timeline info */}
          <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-white/60">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={16} /> Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Creata il</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(rule.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ultima modifica</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(rule.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AutomationDetailPage;
