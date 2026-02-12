"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AutomationRule, AutomationLog, fetchAutomationRules, fetchAutomationLogs, toggleAutomationRule, createAutomationRule } from '../../../lib/supabase';
import { getTriggerTypeLabel, getActionTypeInfo, cn } from '../../../lib/utils';
import AutomationLogsTable from '../../../components/automations/AutomationLogsTable';
import { Zap, Play, Pause, CheckCircle2, AlertTriangle, Activity, PlusCircle, Mail, MessageCircle, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AutomationsPage: React.FC = () => {
  const router = useRouter();
  // Legacy onNavigate support is removed, we use router.push instead
  const onNavigate = (path: string) => router.push(path);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Create form state
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger_type: 'lead_created' as AutomationRule['trigger_type'],
    lead_quality: 'WARM'
  });

  useEffect(() => {
    Promise.all([fetchAutomationRules(), fetchAutomationLogs()]).then(([rulesData, logsData]) => {
      setRules(rulesData);
      setLogs(logsData);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter(r => r.is_active).length;
    const todayLogs = logs.filter(l => {
      const logDate = new Date(l.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    });
    const executionsToday = todayLogs.length;
    const totalExecutions = rules.reduce((sum, r) => sum + r.executions_count, 0);
    const totalSuccess = rules.reduce((sum, r) => sum + r.success_count, 0);
    const successRate = totalExecutions > 0 ? Math.round((totalSuccess / totalExecutions) * 100) : 0;
    return { totalRules, activeRules, executionsToday, successRate };
  }, [rules, logs]);

  const handleToggle = async (ruleId: string) => {
    setTogglingId(ruleId);
    const updated = await toggleAutomationRule(ruleId);
    if (updated) {
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    }
    setTogglingId(null);
  };

  const handleCreate = async () => {
    const rule = await createAutomationRule({
      name: newRule.name,
      description: newRule.description,
      trigger_type: newRule.trigger_type,
      trigger_conditions: { lead_quality: newRule.lead_quality },
      actions: [],
      is_active: true
    });
    setRules(prev => [...prev, rule]);
    setNewRule({ name: '', description: '', trigger_type: 'lead_created', lead_quality: 'WARM' });
    setShowCreateForm(false);
  };

  const actionTypeIcons: Record<string, React.ReactNode> = {
    email: <Mail size={12} />,
    whatsapp: <MessageCircle size={12} />,
    notification: <Bell size={12} />
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Automazioni</h1>
          <p className="text-gray-500 mt-1">Gestisci workflow automatizzati per i tuoi lead.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium active:scale-95"
        >
          <PlusCircle size={18} />
          Nuova Automazione
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Regole Totali', value: stats.totalRules, icon: <Zap size={20} />, color: 'from-blue-500 to-indigo-500' },
          { label: 'Attive', value: stats.activeRules, icon: <Play size={20} />, color: 'from-green-500 to-emerald-500' },
          { label: 'Esecuzioni Oggi', value: stats.executionsToday, icon: <Activity size={20} />, color: 'from-amber-500 to-orange-500' },
          { label: 'Tasso Successo', value: `${stats.successRate}%`, icon: <CheckCircle2 size={20} />, color: 'from-purple-500 to-violet-500' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-md`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <nav className="flex space-x-2 bg-white/40 p-1 rounded-xl w-fit">
          {([
            { key: 'rules', label: 'Regole' },
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
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-dashed border-blue-300 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Nuova Automazione</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-3 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="Es: Follow-up Automatico"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Descrizione</label>
                  <textarea
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-3 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="Descrivi cosa fa questa automazione..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo Trigger</label>
                  <select
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-3 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newRule.trigger_type}
                    onChange={(e) => setNewRule({ ...newRule, trigger_type: e.target.value as AutomationRule['trigger_type'] })}
                  >
                    <option value="lead_created">Lead Creato</option>
                    <option value="lead_status_changed">Cambio Status</option>
                    <option value="lead_inactive">Lead Inattivo</option>
                    <option value="lead_score_changed">Cambio Punteggio</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quality Lead</label>
                  <select
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-3 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newRule.lead_quality}
                    onChange={(e) => setNewRule({ ...newRule, lead_quality: e.target.value })}
                  >
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newRule.name.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Crea Automazione
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {activeTab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2.5 rounded-xl shadow-sm',
                      rule.is_active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{rule.name}</h3>
                      <span className="text-xs text-gray-500">{getTriggerTypeLabel(rule.trigger_type)}</span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggle(rule.id); }}
                    disabled={togglingId === rule.id}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                      rule.is_active ? 'bg-blue-600' : 'bg-gray-300',
                      togglingId === rule.id && 'opacity-50'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                      rule.is_active && 'translate-x-5'
                    )} />
                  </button>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{rule.description}</p>

                {/* Action type badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.from(new Set(rule.actions.map(a => a.type))).map(type => {
                    const info = getActionTypeInfo(type);
                    return (
                      <span key={type} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border', info.color)}>
                        {actionTypeIcons[type]}
                        {info.label}
                      </span>
                    );
                  })}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    {rule.actions.length} azioni
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50/80 rounded-lg py-2">
                    <p className="text-xs text-gray-500">Esecuzioni</p>
                    <p className="text-sm font-bold text-gray-900">{rule.executions_count}</p>
                  </div>
                  <div className="bg-gray-50/80 rounded-lg py-2">
                    <p className="text-xs text-gray-500">Successo</p>
                    <p className="text-sm font-bold text-gray-900">
                      {rule.executions_count > 0 ? Math.round((rule.success_count / rule.executions_count) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50/80 rounded-lg py-2">
                    <p className="text-xs text-gray-500">Azioni</p>
                    <p className="text-sm font-bold text-gray-900">{rule.actions.length}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium',
                  rule.is_active ? 'text-green-600' : 'text-gray-400'
                )}>
                  {rule.is_active ? <Play size={12} /> : <Pause size={12} />}
                  {rule.is_active ? 'Attiva' : 'Disattivata'}
                </span>
                <button
                  onClick={() => onNavigate(`/dashboard/automations/${rule.id}`)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Dettagli &rarr;
                </button>
              </div>
            </motion.div>
          ))}

          {rules.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
              <Zap size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Nessuna automazione</p>
              <p className="text-sm mt-1">Crea la tua prima automazione per iniziare.</p>
            </div>
          )}
        </div>
      ) : (
        <AutomationLogsTable logs={logs} />
      )}
    </motion.div>
  );
};

export default AutomationsPage;
