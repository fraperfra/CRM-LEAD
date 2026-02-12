"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Save, X } from 'lucide-react';

export default function CreateAutomationForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger_type: 'new_lead',
        trigger_condition: {},
        actions: [{ type: 'email', template: '', delay_hours: 0 }],
        active: true,
    });

    const triggerTypes = [
        { value: 'new_lead', label: 'Nuovo Lead' },
        { value: 'status_change', label: 'Cambio Status' },
        { value: 'no_activity_x_days', label: 'Nessuna Attività per X giorni' },
        { value: 'quality_change', label: 'Cambio Quality' },
    ];

    const actionTypes = [
        { value: 'email', label: 'Email' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'notification', label: 'Notifica' },
        { value: 'update_field', label: 'Aggiorna Campo' },
    ];

    const addAction = () => {
        setFormData({
            ...formData,
            actions: [...formData.actions, { type: 'email', template: '', delay_hours: 0 }],
        });
    };

    const removeAction = (index: number) => {
        setFormData({
            ...formData,
            actions: formData.actions.filter((_, i) => i !== index),
        });
    };

    const updateAction = (index: number, field: string, value: any) => {
        const newActions = [...formData.actions];
        newActions[index] = { ...newActions[index], [field]: value };
        setFormData({ ...formData, actions: newActions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('automation_rules')
            .insert([formData]);

        if (error) {
            alert('Errore nella creazione: ' + error.message);
            setLoading(false);
            return;
        }

        router.push('/dashboard/automations');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Nuova Automazione</h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                        <X className="w-4 h-4" />
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Salvataggio...' : 'Salva'}
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Informazioni Base</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Automazione *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="es. Follow-up Lead WARM"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrizione
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Descrizione dell'automazione..."
                    />
                </div>
            </div>

            {/* Trigger Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Trigger</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo Trigger *
                    </label>
                    <select
                        required
                        value={formData.trigger_type}
                        onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {triggerTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900">
                        💡 Le condizioni specifiche del trigger possono essere configurate in JSON nel campo trigger_condition
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Azioni</h3>
                    <button
                        type="button"
                        onClick={addAction}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                    >
                        + Aggiungi Azione
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.actions.map((action, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    Azione #{index + 1}
                                </span>
                                {formData.actions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAction(index)}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Rimuovi
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={action.type}
                                        onChange={(e) => updateAction(index, 'type', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    >
                                        {actionTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Template
                                    </label>
                                    <input
                                        type="text"
                                        value={action.template || ''}
                                        onChange={(e) => updateAction(index, 'template', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder="Template ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Ritardo (ore)
                                    </label>
                                    <input
                                        type="number"
                                        value={action.delay_hours || 0}
                                        onChange={(e) => updateAction(index, 'delay_hours', parseInt(e.target.value))}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        Attiva immediatamente questa automazione
                    </span>
                </label>
            </div>
        </form>
    );
}
