'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { AlertCircle, CheckCircle, Play, RefreshCw, UserPlus } from 'lucide-react'

export default function TestPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const generateMockLead = async () => {
        setLoading(true)
        setResult(null)

        try {
            // 1. Generate Random Data
            const nomi = ['Mario', 'Luigi', 'Anna', 'Giovanna', 'Paolo', 'Francesca', 'Roberto', 'Elena']
            const cognomi = ['Rossi', 'Bianchi', 'Verdi', 'Colombo', 'Esposito', 'Ricci', 'Romano', 'Ferrari']
            const nome = nomi[Math.floor(Math.random() * nomi.length)]
            const cognome = cognomi[Math.floor(Math.random() * cognomi.length)]

            const tipologie = ['Appartamento', 'Villa', 'Attico', 'Loft', 'Rustico']
            const tipologia = tipologie[Math.floor(Math.random() * tipologie.length)]

            const randomPhone = '3' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')

            const mockLead = {
                nome: `${nome} ${cognome}`,
                email: `${nome.toLowerCase()}.${cognome.toLowerCase()}.${Math.floor(Math.random() * 1000)}@example.com`,
                telefono: randomPhone,
                indirizzo: `Via Roma ${Math.floor(Math.random() * 100)}, Milano`,
                motivazione: 'Vendere per riacquisto',
                tipologia: tipologia,
                superficie: Math.floor(Math.random() * 100) + 50,
                locali: Math.floor(Math.random() * 3) + 2,
                bagni: Math.floor(Math.random() * 2) + 1,
                piano: Math.floor(Math.random() * 5),
                ascensore: Math.random() > 0.5,
                condizione: 'Buono',
                classe_energetica: 'D',
                punteggio: Math.floor(Math.random() * 40) + 60, // 60-100
                status: 'nuovo',
                source: 'test_generator',
                landing_page_url: 'https://valutacasa.it/test',
                consenso_privacy: true,
                consenso_marketing: true,
                assigned_to: (await supabase.auth.getUser()).data.user?.id // Assign to current user
            }

            // 2. Insert Lead
            const { data, error } = await supabase
                .from('leads')
                .insert([mockLead])
                .select()
                .single()

            if (error) throw error

            setResult({
                success: true,
                lead: data,
                message: 'Lead di test generato con successo! Le automazioni "Nuovo Lead" dovrebbero partire a breve.'
            })

            // Optional: Trigger manual check via API if we want instant gratification (but cron runs every minute anyway)
            // await fetch('/api/cron/process-automations')

        } catch (error: any) {
            console.error(error)
            setResult({
                success: false,
                message: error.message || 'Errore nella generazione del lead'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Test e Debug</h1>
                <p className="text-gray-600 mt-1">Strumenti per verificare il funzionamento del sistema</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Genera Lead di Test</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Crea un lead finto con dati casuali (nome, telefono, email, immobile).
                            Utile per verificare che le automazioni "Nuovo Lead" partano correttemente.
                        </p>

                        <div className="mt-6">
                            <button
                                onClick={generateMockLead}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                {loading ? 'Generazione...' : 'Genera Lead Mock'}
                            </button>
                        </div>

                        {result && (
                            <div className={`mt-6 p-4 rounded-lg border flex gap-3 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {result.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                )}
                                <div>
                                    <h4 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                        {result.success ? 'Successo' : 'Errore'}
                                    </h4>
                                    <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.message}
                                    </p>
                                    {result.success && (
                                        <div className="mt-2 text-xs font-mono text-green-800 bg-green-100 p-2 rounded">
                                            ID: {result.lead.id}<br />
                                            Email: {result.lead.email}<br />
                                            Tipologia: {result.lead.tipologia}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Note:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>La source sarà impostata su <code>test_generator</code>.</li>
                    <li>L'indirizzo email generato è fittizio (<code>@example.com</code>).</li>
                    <li>Il telefono è generato casualmente.</li>
                    <li>Il lead viene assegnato automaticamente al tuo utente.</li>
                </ul>
            </div>
        </div>
    )
}
