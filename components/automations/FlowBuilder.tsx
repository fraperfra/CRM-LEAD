import { useState } from 'react';
import { AutomationRule, AutomationAction } from '../../lib/supabase';
import { formatDelay, getTriggerTypeLabel, getActionTypeInfo, cn } from '../../lib/utils';
import { Zap, Mail, MessageCircle, Bell, Smartphone, Globe, Plus, Clock, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowBuilderProps {
  rule: AutomationRule;
  editable?: boolean;
  onAddAction?: (action: Omit<AutomationAction, 'id' | 'order'>) => void;
  onRemoveAction?: (actionId: string) => void;
}

const actionIcons: Record<string, React.ReactNode> = {
  email: <Mail size={18} />,
  whatsapp: <MessageCircle size={18} />,
  notification: <Bell size={18} />,
  sms: <Smartphone size={18} />,
  webhook: <Globe size={18} />
};

const FlowBuilder: React.FC<FlowBuilderProps> = ({ rule, editable = false, onAddAction, onRemoveAction }) => {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAction, setNewAction] = useState({
    type: 'email' as AutomationAction['type'],
    delay_minutes: 0,
    template_name: '',
    subject: '',
    content: ''
  });

  const handleAddAction = () => {
    if (!onAddAction) return;
    onAddAction({
      type: newAction.type,
      delay_minutes: newAction.delay_minutes,
      config: {
        template_name: newAction.template_name || undefined,
        subject: newAction.subject || undefined,
        content: newAction.content || undefined
      }
    });
    setNewAction({ type: 'email', delay_minutes: 0, template_name: '', subject: '', content: '' });
    setShowAddForm(false);
  };

  const triggerConditionBadges = () => {
    const badges: string[] = [];
    if (rule.trigger_conditions.lead_quality) {
      badges.push(`Lead ${rule.trigger_conditions.lead_quality}`);
    }
    if (rule.trigger_conditions.inactive_hours) {
      badges.push(`Dopo ${rule.trigger_conditions.inactive_hours}h`);
    }
    if (rule.trigger_conditions.status) {
      badges.push(`Status: ${rule.trigger_conditions.status}`);
    }
    return badges;
  };

  return (
    <div className="flex flex-col items-center py-4">
      {/* Trigger Block */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-xl border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Trigger</span>
              <p className="text-sm font-semibold text-gray-900">{getTriggerTypeLabel(rule.trigger_type)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {triggerConditionBadges().map((badge, i) => (
              <span key={i} className="px-2.5 py-1 bg-amber-100/80 text-amber-800 text-xs font-medium rounded-lg border border-amber-200">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      {rule.actions.map((action, index) => (
        <React.Fragment key={action.id}>
          {/* Connector */}
          <Connector delay={action.delay_minutes} />

          {/* Action Block */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 1) * 0.1 }}
            className="w-full max-w-md"
          >
            <div
              className={cn(
                'bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm transition-all',
                expandedAction === action.id && 'ring-2 ring-blue-200'
              )}
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl border', getActionTypeInfo(action.type).color)}>
                      {actionIcons[action.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Azione {index + 1}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', getActionTypeInfo(action.type).color)}>
                          {getActionTypeInfo(action.type).label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {action.config.template_name || action.config.subject || 'Azione senza nome'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editable && onRemoveAction && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveAction(action.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {expandedAction === action.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedAction === action.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-3">
                      <div className="pt-3 grid grid-cols-2 gap-3">
                        {action.config.subject && (
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500 font-medium">Oggetto</label>
                            <p className="text-sm text-gray-800 mt-0.5">{action.config.subject}</p>
                          </div>
                        )}
                        {action.config.content && (
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500 font-medium">Contenuto</label>
                            <p className="text-sm text-gray-600 mt-0.5 bg-gray-50 p-3 rounded-lg">{action.config.content}</p>
                          </div>
                        )}
                        {action.config.recipient && (
                          <div>
                            <label className="text-xs text-gray-500 font-medium">Destinatario</label>
                            <p className="text-sm text-gray-800 mt-0.5">{action.config.recipient}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </React.Fragment>
      ))}

      {/* Add Action Button */}
      {editable && (
        <>
          {rule.actions.length > 0 && <Connector />}
          <AnimatePresence>
            {showAddForm ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
              >
                <div className="bg-white/70 backdrop-blur-xl border-2 border-dashed border-blue-300 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-gray-900">Nuova Azione</h4>
                    <button onClick={() => setShowAddForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Tipo</label>
                      <select
                        className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAction.type}
                        onChange={(e) => setNewAction({ ...newAction, type: e.target.value as AutomationAction['type'] })}
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="notification">Notifica</option>
                        <option value="sms">SMS</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Ritardo (minuti)</label>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAction.delay_minutes}
                        onChange={(e) => setNewAction({ ...newAction, delay_minutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600">Nome Template</label>
                      <input
                        type="text"
                        className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAction.template_name}
                        onChange={(e) => setNewAction({ ...newAction, template_name: e.target.value })}
                        placeholder="Es: Email di Benvenuto"
                      />
                    </div>
                    {(newAction.type === 'email') && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-600">Oggetto</label>
                        <input
                          type="text"
                          className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newAction.subject}
                          onChange={(e) => setNewAction({ ...newAction, subject: e.target.value })}
                          placeholder="Oggetto dell'email"
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600">Contenuto</label>
                      <textarea
                        className="mt-1 w-full text-sm border border-gray-200 rounded-xl p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                        value={newAction.content}
                        onChange={(e) => setNewAction({ ...newAction, content: e.target.value })}
                        placeholder="Contenuto del messaggio..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddAction}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md active:scale-[0.98]"
                  >
                    Aggiungi Azione
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <Plus size={16} />
                Aggiungi Azione
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

// Connector line between blocks
const Connector: React.FC<{ delay?: number }> = ({ delay }) => (
  <div className="flex flex-col items-center py-1">
    <div className="w-0.5 h-6 bg-gradient-to-b from-blue-300 to-indigo-300 rounded-full" />
    {delay !== undefined && delay > 0 && (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs text-gray-500 font-medium shadow-sm -my-0.5 z-10">
        <Clock size={12} className="text-blue-500" />
        {formatDelay(delay)}
      </div>
    )}
    {delay !== undefined && delay === 0 && (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium shadow-sm -my-0.5 z-10">
        <Zap size={12} />
        Immediato
      </div>
    )}
    <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-300 to-blue-300 rounded-full" />
    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
  </div>
);

export default FlowBuilder;
