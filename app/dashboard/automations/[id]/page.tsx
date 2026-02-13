'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type AutomationSequence, type Template, fetchTemplates } from '@/lib/supabase'
import { ArrowLeft, Plus, Save, Clock, Mail, MessageSquare, CheckSquare, Trash2, GripVertical, AlertCircle, Zap } from 'lucide-react'

type AutomationStep = {
  id: string
  type: 'email' | 'whatsapp' | 'sms' | 'delay' | 'task'
  name: string
  config: any
}

export default function AutomationEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [automation, setAutomation] = useState<AutomationSequence | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])

  // Available templates for selection
  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    const [automationRes, templatesRes] = await Promise.all([
      supabase.from('automation_sequences').select('*').eq('id', id).single(),
      fetchTemplates()
    ])

    if (automationRes.data) {
      setAutomation(automationRes.data as AutomationSequence)
    }
    if (templatesRes) {
      setTemplates(templatesRes)
    }
    setLoading(false)
  }

  const updateField = (field: keyof AutomationSequence, value: any) => {
    if (!automation) return
    setAutomation({ ...automation, [field]: value })
  }

  const addStep = (type: AutomationStep['type']) => {
    if (!automation) return

    const newStep: AutomationStep = {
      id: crypto.randomUUID(),
      type,
      name: type === 'delay' ? 'Attesa' : type === 'email' ? 'Invia Email' : type === 'whatsapp' ? 'Invia WhatsApp' : 'Task',
      config: {}
    }

    const steps = [...(automation.steps || []), newStep]
    updateField('steps', steps)
  }

  const removeStep = (stepId: string) => {
    if (!automation) return
    const steps = (automation.steps || []).filter((s: AutomationStep) => s.id !== stepId)
    updateField('steps', steps)
  }

  const updateStepConfig = (stepId: string, config: any) => {
    if (!automation) return
    const steps = (automation.steps || []).map((s: AutomationStep) =>
      s.id === stepId ? { ...s, config: { ...s.config, ...config } } : s
    )
    updateField('steps', steps)
  }

  const saveAutomation = async () => {
    if (!automation) return
    setSaving(true)

    const { error } = await supabase
      .from('automation_sequences')
      .update({
        name: automation.name,
        description: automation.description,
        trigger_type: automation.trigger_type,
        trigger_conditions: automation.trigger_conditions || {},
        steps: automation.steps || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert('Errore nel salvataggio: ' + error.message)
      console.error(error)
    } else {
      alert('Salvataggio completato con successo!')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center">Caricamento...</div>
  if (!automation) return <div className="p-10 text-center">Automazione non trovata</div>

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <input
              type="text"
              value={automation.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400 w-full"
              placeholder="Nome Automazione"
            />
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span className={`w-2 h-2 rounded-full ${automation.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              {automation.active ? 'Attiva' : 'Bozza'}
            </div>
          </div>
        </div>
        <button
          onClick={saveAutomation}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-8">

          {/* Trigger Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Trigger (Punto di Partenza)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quando si attiva?</label>
                <select
                  value={automation.trigger_type}
                  onChange={(e) => updateField('trigger_type', e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="new_lead">Nuovo Lead Creato</option>
                  <option value="status_change">Cambio Stato Lead</option>
                  <option value="no_activity_days">Nessuna Attività per X giorni</option>
                  <option value="lead_quality">Qualità Lead Cambiamenta</option>
                  <option value="manual">Avvio Manuale</option>
                </select>
              </div>
            </div>

            {/* Trigger Conditions */}
            {automation.trigger_type === 'status_change' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-900 mb-1">Quale nuovo stato?</label>
                <select
                  value={automation.trigger_conditions?.status || ''}
                  onChange={(e) => updateField('trigger_conditions', { ...automation.trigger_conditions, status: e.target.value })}
                  className="w-full border-blue-200 rounded-lg p-2"
                >
                  <option value="">Qualsiasi stato</option>
                  <option value="nuovo">Nuovo</option>
                  <option value="contattato">Contattato</option>
                  <option value="qualificato">Qualificato</option>
                  <option value="in_trattativa">In Trattativa</option>
                  <option value="vinto">Vinto</option>
                  <option value="perso">Perso</option>
                </select>
              </div>
            )}

            {automation.trigger_type === 'no_activity_days' && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-orange-900 mb-1">Giorni di inattività</label>
                <input
                  type="number"
                  min="1"
                  value={automation.trigger_conditions?.days || 3}
                  onChange={(e) => updateField('trigger_conditions', { ...automation.trigger_conditions, days: parseInt(e.target.value) })}
                  className="w-full border-orange-200 rounded-lg p-2"
                />
              </div>
            )}

            {automation.trigger_type === 'lead_quality' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-purple-900 mb-1">Livello Qualità Raggiunto</label>
                <select
                  value={automation.trigger_conditions?.quality || 'HOT'}
                  onChange={(e) => updateField('trigger_conditions', { ...automation.trigger_conditions, quality: e.target.value })}
                  className="w-full border-purple-200 rounded-lg p-2"
                >
                  <option value="HOT">HOT (Alta Priorità)</option>
                  <option value="WARM">WARM (Interessante)</option>
                  <option value="COLD">COLD (Freddo)</option>
                </select>
              </div>
            )}
          </div>

          {/* Steps Timeline */}
          <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 ml-4">
            {(automation.steps || []).map((step: AutomationStep, index: number) => (
              <div key={step.id} className="relative bg-white p-5 rounded-xl border border-gray-200 shadow-sm group">
                {/* Connector Dot */}
                <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 border-white bg-gray-300 group-hover:bg-blue-500 transition-colors"></div>

                {/* Step Header */}
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${step.type === 'delay' ? 'bg-amber-100 text-amber-600' :
                      step.type === 'email' ? 'bg-blue-100 text-blue-600' :
                        step.type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                      }`}>
                      {step.type === 'delay' && <Clock className="w-5 h-5" />}
                      {step.type === 'email' && <Mail className="w-5 h-5" />}
                      {step.type === 'whatsapp' && <MessageSquare className="w-5 h-5" />}
                      {step.type === 'task' && <CheckSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Step {index + 1}: {step.name}</h4>
                      <p className="text-xs text-gray-500 uppercase">{step.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Step Config */}
                <div className="space-y-4">
                  {step.type === 'delay' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attendi per (ore)</label>
                      <input
                        type="number"
                        min="1"
                        value={step.config?.hours || 24}
                        onChange={(e) => updateStepConfig(step.id, { hours: parseInt(e.target.value) })}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                  )}

                  {(step.type === 'email' || step.type === 'whatsapp') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Template</label>
                      <select
                        value={step.config?.template_id || ''}
                        onChange={(e) => updateStepConfig(step.id, { template_id: e.target.value })}
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="">-- Seleziona un template --</option>
                        {templates
                          .filter(t => t.type === step.type)
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))
                        }
                      </select>
                      {step.config?.template_id && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          Template ID: {step.config.template_id}
                        </div>
                      )}
                    </div>
                  )}

                  {step.type === 'task' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Task</label>
                      <input
                        type="text"
                        value={step.config?.title || ''}
                        onChange={(e) => updateStepConfig(step.id, { title: e.target.value })}
                        placeholder="Es. Chiamare cliente"
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Step Button */}
            <div className="relative pt-4">
              <div className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="flex gap-2">
                <button onClick={() => addStep('email')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <Mail className="w-4 h-4 text-blue-500" /> Email
                </button>
                <button onClick={() => addStep('whatsapp')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp
                </button>
                <button onClick={() => addStep('delay')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <Clock className="w-4 h-4 text-amber-500" /> Attesa
                </button>
                <button onClick={() => addStep('task')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <CheckSquare className="w-4 h-4 text-purple-500" /> Task
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Info & Stats */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Dettagli</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Descrizione</label>
                <textarea
                  value={automation.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm h-24"
                  placeholder="A cosa serve questa automazione?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Iscritti Totali</label>
                <div className="text-2xl font-bold">{automation.total_enrolled}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Completati</label>
                <div className="text-2xl font-bold">{automation.total_completed}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Le automazioni vengono processate ogni ora. Assicurati che i template selezionati siano attivi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
