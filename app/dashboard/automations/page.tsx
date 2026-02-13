'use client'

import { useState, useEffect } from 'react'
import { Plus, Play, Pause, Edit, Trash2, Zap, Settings } from 'lucide-react'
import { supabase, type AutomationSequence } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationSequence[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('automation_sequences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching automations:', error)
    } else {
      setAutomations(data as AutomationSequence[] || [])
    }
    setLoading(false)
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('automation_sequences')
      .update({ active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchAutomations()
    }
  }

  const deleteAutomation = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa automazione?')) return

    const { error } = await supabase
      .from('automation_sequences')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchAutomations()
    }
  }

  const createNewAutomation = async () => {
    // Create a blank automation and redirect to editor
    const { data, error } = await supabase
      .from('automation_sequences')
      .insert([{
        name: 'Nuova Automazione',
        trigger_type: 'manual',
        steps: [],
        active: false
      }])
      .select()
      .single()

    if (data) {
      router.push(`/dashboard/automations/${data.id}`)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automazioni</h1>
          <p className="text-gray-600 mt-1">Gestisci i flussi di lavoro automatici per i tuoi lead</p>
        </div>
        <button
          onClick={createNewAutomation}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuova Automazione
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Caricamento automazioni...</div>
      ) : automations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nessuna automazione attiva</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Crea workflow automatici per inviare email, SMS e assegnare task in base al comportamento dei lead.</p>
          <button
            onClick={createNewAutomation}
            className="mt-6 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Crea la prima automazione
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {automations.map((automation) => (
            <div key={automation.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${automation.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{automation.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      {automation.trigger_type === 'new_lead' ? 'Nuovo Lead' :
                        automation.trigger_type === 'status_change' ? 'Cambio Stato' :
                          automation.trigger_type === 'no_activity_days' ? 'Nessuna Attività' :
                            automation.trigger_type === 'lead_quality' ? 'Qualità Lead' : 'Manuale'}
                    </span>
                    <span>•</span>
                    <span>{(automation.steps || []).length} step</span>
                    <span>•</span>
                    <span>{automation.total_enrolled} iscritti</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStatus(automation.id, automation.active)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${automation.active
                      ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {automation.active ? (
                    <div className="flex items-center gap-2"><Pause className="w-3.5 h-3.5" /> Pausa</div>
                  ) : (
                    <div className="flex items-center gap-2"><Play className="w-3.5 h-3.5" /> Attiva</div>
                  )}
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <Link
                  href={`/dashboard/automations/${automation.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => deleteAutomation(automation.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
