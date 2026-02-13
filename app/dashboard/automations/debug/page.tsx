'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

export default function AutomationDebugPage() {
    const [automations, setAutomations] = useState<any[]>([])
    const [enrollments, setEnrollments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [lastLead, setLastLead] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)

        // 1. Fetch Automations
        const { data: autos } = await supabase
            .from('automation_sequences')
            .select('*')
            .order('created_at', { ascending: false })

        setAutomations(autos || [])

        // 2. Fetch recent Enrollments
        const { data: enr } = await supabase
            .from('automation_enrollments')
            .select('*, leads(email, nome)')
            .order('created_at', { ascending: false })
            .limit(10)

        setEnrollments(enr || [])

        // 3. Fetch last lead to see if we can test against it
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        setLastLead(lead)

        setLoading(false)
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Debug Automazioni</h1>

            {/* 1. Status Check */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" onClick={loadData} style={{ cursor: 'pointer' }} />
                    Stato Attuale
                </h2>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Automazioni Attive ('new_lead')</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            {automations.filter(a => a.trigger_type === 'new_lead' && a.active).length === 0 ? (
                                <div className="text-red-500 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Nessuna automazione attiva per "Nuovo Lead"!
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {automations.filter(a => a.trigger_type === 'new_lead' && a.active).map(a => (
                                        <li key={a.id} className="text-green-600 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {a.name} (ID: {a.id})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Ultimi 10 Enrollments</h3>
                        {enrollments.length === 0 ? (
                            <p className="text-gray-500 italic">Nessun enrollment trovato.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Lead</th>
                                        <th className="p-2">Stato</th>
                                        <th className="p-2">Step</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map(e => (
                                        <tr key={e.id} className="border-b">
                                            <td className="p-2">{new Date(e.created_at || e.enrolled_at).toLocaleString()}</td>
                                            <td className="p-2">{e.leads?.nome} ({e.leads?.email})</td>
                                            <td className="p-2">{e.status}</td>
                                            <td className="p-2">{e.current_step}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Ultimo Lead Inserito</h3>
                        {lastLead ? (
                            <div className="bg-blue-50 p-4 rounded-lg text-sm font-mono">
                                ID: {lastLead.id}<br />
                                Nome: {lastLead.nome}<br />
                                Creato: {new Date(lastLead.created_at).toLocaleString()}<br />
                                Stato: {lastLead.status}
                            </div>
                        ) : (
                            <p>Nessun lead trovato.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
