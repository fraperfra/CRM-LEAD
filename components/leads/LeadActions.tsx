'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, MessageSquare, X, Copy, ExternalLink } from 'lucide-react'
import { fetchTemplates, type Template, type Lead } from '@/lib/supabase'

interface LeadActionsProps {
    lead: Lead
}

export function LeadActions({ lead }: LeadActionsProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [actionType, setActionType] = useState<'whatsapp' | 'call_script' | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [previewMessage, setPreviewMessage] = useState('')

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        const data = await fetchTemplates()
        setTemplates(data)
    }

    const handleActionClick = (type: 'whatsapp' | 'call_script') => {
        setActionType(type)
        // Auto-select first matching template
        const matching = templates.filter(t => t.type === type && t.active)
        if (matching.length > 0) {
            handleTemplateSelect(matching[0])
        } else {
            setSelectedTemplate(null)
            setPreviewMessage('')
        }
        setIsModalOpen(true)
    }

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template)
        let msg = template.body

        // Replace variables
        // Supported: {{nome}}, {{indirizzo}}, {{telefono}}, {{email}}
        msg = msg.replace(/{{nome}}/g, lead.nome || '')
        msg = msg.replace(/{{indirizzo}}/g, lead.indirizzo || '')
        msg = msg.replace(/{{telefono}}/g, lead.telefono || '')
        msg = msg.replace(/{{email}}/g, lead.email || '')

        setPreviewMessage(msg)
    }

    const handleProceed = () => {
        if (actionType === 'whatsapp') {
            const phone = lead.telefono.replace(/\s+/g, '').replace(/[^0-9+]/g, '')
            const encodedMsg = encodeURIComponent(previewMessage)
            window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank')
        }
        // For Call Script, we just keep the modal open or maybe copy to clipboard? 
        // Typically call script is read from the screen.
        // We can create a "Log Activity" feature here later.
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(previewMessage)
        alert('Testo copiato!')
    }

    const matchingTemplates = templates.filter(t => t.type === actionType && t.active)

    return (
        <>
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                    onClick={() => handleActionClick('call_script')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                    <Phone className="w-4 h-4" />
                    Chiama
                </button>
                <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                    <Mail className="w-4 h-4" />
                    Email
                </a>
                <button
                    onClick={() => handleActionClick('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {actionType === 'whatsapp' ? 'Invia WhatsApp' : 'Script Chiamata'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Template</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={selectedTemplate?.id || ''}
                                    onChange={e => {
                                        const t = templates.find(t => t.id === e.target.value)
                                        if (t) handleTemplateSelect(t)
                                    }}
                                >
                                    <option value="">-- Seleziona --</option>
                                    {matchingTemplates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Anteprima Messaggio</label>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px] text-sm whitespace-pre-wrap">
                                    {previewMessage || <span className="text-gray-400 italic">Seleziona un template per vedere l'anteprima...</span>}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {actionType === 'whatsapp' ? (
                                    <button
                                        onClick={handleProceed}
                                        disabled={!previewMessage}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Apri WhatsApp
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleProceed} // Could be "Call Now" tel link
                                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                                        onClick={() => window.location.href = `tel:${lead.telefono}`}
                                    >
                                        <Phone className="w-4 h-4" />
                                        Chiama Ora
                                    </button>
                                )}

                                <button
                                    onClick={copyToClipboard}
                                    disabled={!previewMessage}
                                    className="px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                                    title="Copia testo"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Manual override warning */}
                            <p className="text-xs text-gray-500 text-center">
                                {actionType === 'whatsapp'
                                    ? "Si aprirà WhatsApp Web/Desktop con il messaggio precompilato."
                                    : "Usa questo script come guida durante la conversazione."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
