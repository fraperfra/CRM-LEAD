'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, MessageSquare, Phone, Mail, FileText } from 'lucide-react'
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, type Template } from '@/lib/supabase'

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Template>>({
        name: '',
        type: 'whatsapp',
        category: '',
        body: '',
        subject: '',
    })

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        setLoading(true)
        const data = await fetchTemplates()
        setTemplates(data)
        setLoading(false)
    }

    const handleOpenModal = (template?: Template) => {
        if (template) {
            setEditingTemplate(template)
            setFormData(template)
        } else {
            setEditingTemplate(null)
            setFormData({
                name: '',
                type: 'whatsapp',
                category: '',
                body: '',
                subject: '',
                variables: []
            })
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            // Extract variables from body: {{variable}}
            const variableRegex = /{{([^}]+)}}/g
            const variables = []
            let match
            while ((match = variableRegex.exec(formData.body || '')) !== null) {
                variables.push(match[1])
            }

            const payload = {
                ...formData,
                variables: [...new Set(variables)] // Unique variables
            }

            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, payload)
            } else {
                await createTemplate(payload)
            }
            setIsModalOpen(false)
            loadTemplates()
        } catch (error) {
            alert('Errore nel salvataggio del template')
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo template?')) return
        try {
            await deleteTemplate(id)
            loadTemplates()
        } catch (error) {
            console.error(error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'whatsapp': return <MessageSquare className="w-5 h-5 text-green-500" />
            case 'email': return <Mail className="w-5 h-5 text-blue-500" />
            case 'call_script': return <Phone className="w-5 h-5 text-purple-500" />
            default: return <FileText className="w-5 h-5 text-gray-500" />
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Template Messaggi</h1>
                    <p className="text-gray-600 mt-1">Gestisci i modelli per WhatsApp, Email e Script di Chiamata</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuovo Template
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Caricamento...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        {getIcon(template.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-gray-500 uppercase tracking-wider">{template.type}</span>
                                            {template.category && (
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                    {template.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(template)} className="text-gray-400 hover:text-blue-600 p-1">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(template.id)} className="text-gray-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4 line-clamp-3 font-mono">
                                {template.body}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {template.variables.map(v => (
                                    <span key={v} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingTemplate ? 'Modifica Template' : 'Nuovo Template'}</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="es. Primo Contatto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="call_script">Script Chiamata</option>
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                    </select>
                                </div>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2"
                                value={formData.category || ''}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="es. Welcome, Follow-up"
                            />
                        </div>
                    </div>

                    {formData.type === 'email' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2"
                                value={formData.subject || ''}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Oggetto dell'email"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Messaggio</label>
                        <p className="text-xs text-gray-500 mb-2">Usa le doppie graffe per le variabili. Esempio: <code>Ciao {'{{nome}}'}</code></p>
                        <textarea
                            className="w-full border rounded-lg p-3 h-40 font-mono text-sm"
                            value={formData.body}
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                            placeholder="Scrivi qui il tuo messaggio..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Salva Template
                        </button>
                    </div>
                </div>
                    </div>
                </div >
            )
}
        </div >
    )
}
