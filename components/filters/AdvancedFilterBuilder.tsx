"use client";

import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

interface FilterCondition {
    field: string;
    operator: string;
    value: any;
}

interface FilterGroup {
    logic: 'AND' | 'OR';
    conditions: FilterCondition[];
}

interface AdvancedFilterBuilderProps {
    onApply: (groups: FilterGroup[]) => void;
    onSave?: (name: string, groups: FilterGroup[]) => void;
}

const FIELDS = [
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'lead_quality', label: 'Quality', type: 'select' },
    { value: 'tipologia', label: 'Tipologia', type: 'select' },
    { value: 'nome', label: 'Nome', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'telefono', label: 'Telefono', type: 'text' },
    { value: 'valutazione_stimata', label: 'Valutazione', type: 'number' },
    { value: 'punteggio', label: 'Punteggio', type: 'number' },
    { value: 'created_at', label: 'Data Creazione', type: 'date' },
    { value: 'last_contact_date', label: 'Ultimo Contatto', type: 'date' },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
    text: [
        { value: 'contains', label: 'Contiene' },
        { value: 'equals', label: 'Uguale a' },
        { value: 'not_equals', label: 'Diverso da' },
        { value: 'starts_with', label: 'Inizia con' },
        { value: 'ends_with', label: 'Finisce con' },
    ],
    number: [
        { value: 'equals', label: 'Uguale a' },
        { value: 'not_equals', label: 'Diverso da' },
        { value: 'greater_than', label: 'Maggiore di' },
        { value: 'less_than', label: 'Minore di' },
        { value: 'greater_than_or_equal', label: 'Maggiore o uguale' },
        { value: 'less_than_or_equal', label: 'Minore o uguale' },
    ],
    select: [
        { value: 'equals', label: 'Uguale a' },
        { value: 'not_equals', label: 'Diverso da' },
        { value: 'in', label: 'Uno di' },
    ],
    date: [
        { value: 'after', label: 'Dopo il' },
        { value: 'before', label: 'Prima del' },
        { value: 'between', label: 'Tra' },
        { value: 'last_n_days', label: 'Ultimi N giorni' },
        { value: 'older_than_days', label: 'Più vecchi di N giorni' },
    ],
};

const STATUS_OPTIONS = ['nuovo', 'contattato', 'qualificato', 'in_trattativa', 'vinto', 'perso'];
const QUALITY_OPTIONS = ['HOT', 'WARM', 'COLD'];
const TIPOLOGIA_OPTIONS = ['vendita', 'acquisto', 'affitto', 'valutazione'];

export default function AdvancedFilterBuilder({ onApply, onSave }: AdvancedFilterBuilderProps) {
    const [groups, setGroups] = useState<FilterGroup[]>([
        { logic: 'AND', conditions: [{ field: 'status', operator: 'equals', value: '' }] },
    ]);
    const [filterName, setFilterName] = useState('');

    function addGroup() {
        setGroups([...groups, { logic: 'AND', conditions: [{ field: 'status', operator: 'equals', value: '' }] }]);
    }

    function removeGroup(groupIndex: number) {
        setGroups(groups.filter((_, idx) => idx !== groupIndex));
    }

    function addCondition(groupIndex: number) {
        const newGroups = [...groups];
        newGroups[groupIndex].conditions.push({ field: 'status', operator: 'equals', value: '' });
        setGroups(newGroups);
    }

    function removeCondition(groupIndex: number, conditionIndex: number) {
        const newGroups = [...groups];
        newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter(
            (_, idx) => idx !== conditionIndex
        );
        setGroups(newGroups);
    }

    function updateCondition(
        groupIndex: number,
        conditionIndex: number,
        field: keyof FilterCondition,
        value: any
    ) {
        const newGroups = [...groups];
        newGroups[groupIndex].conditions[conditionIndex][field] = value;

        // Reset operator when field changes
        if (field === 'field') {
            const fieldType = FIELDS.find((f) => f.value === value)?.type || 'text';
            newGroups[groupIndex].conditions[conditionIndex].operator = OPERATORS[fieldType][0].value;
            newGroups[groupIndex].conditions[conditionIndex].value = '';
        }

        setGroups(newGroups);
    }

    function toggleGroupLogic(groupIndex: number) {
        const newGroups = [...groups];
        newGroups[groupIndex].logic = newGroups[groupIndex].logic === 'AND' ? 'OR' : 'AND';
        setGroups(newGroups);
    }

    function getFieldType(fieldValue: string): string {
        return FIELDS.find((f) => f.value === fieldValue)?.type || 'text';
    }

    function renderValueInput(groupIndex: number, conditionIndex: number, condition: FilterCondition) {
        const fieldType = getFieldType(condition.field);

        if (condition.field === 'status') {
            return (
                <select
                    value={condition.value}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                    <option value="">Seleziona...</option>
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (condition.field === 'lead_quality') {
            return (
                <select
                    value={condition.value}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                    <option value="">Seleziona...</option>
                    {QUALITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (condition.field === 'tipologia') {
            return (
                <select
                    value={condition.value}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                    <option value="">Seleziona...</option>
                    {TIPOLOGIA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (fieldType === 'number') {
            return (
                <input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    placeholder="Valore..."
                />
            );
        }

        if (fieldType === 'date') {
            return (
                <input
                    type={condition.operator === 'last_n_days' || condition.operator === 'older_than_days' ? 'number' : 'date'}
                    value={condition.value}
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    placeholder={
                        condition.operator === 'last_n_days' || condition.operator === 'older_than_days'
                            ? 'Giorni...'
                            : ''
                    }
                />
            );
        }

        return (
            <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                placeholder="Valore..."
            />
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filtri Avanzati</h3>
                <button
                    onClick={addGroup}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                    <Plus className="w-4 h-4" />
                    Aggiungi Gruppo
                </button>
            </div>

            {/* Filter Groups */}
            <div className="space-y-4">
                {groups.map((group, groupIndex) => (
                    <div key={groupIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={() => toggleGroupLogic(groupIndex)}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                            >
                                {group.logic}
                            </button>
                            {groups.length > 1 && (
                                <button onClick={() => removeGroup(groupIndex)} className="text-red-600 hover:text-red-700">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {group.conditions.map((condition, conditionIndex) => (
                                <div key={conditionIndex} className="flex items-center gap-2">
                                    <select
                                        value={condition.field}
                                        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'field', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    >
                                        {FIELDS.map((field) => (
                                            <option key={field.value} value={field.value}>
                                                {field.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'operator', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    >
                                        {OPERATORS[getFieldType(condition.field)].map((op) => (
                                            <option key={op.value} value={op.value}>
                                                {op.label}
                                            </option>
                                        ))}
                                    </select>

                                    {renderValueInput(groupIndex, conditionIndex, condition)}

                                    <button
                                        onClick={() => removeCondition(groupIndex, conditionIndex)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        disabled={group.conditions.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addCondition(groupIndex)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="w-3 h-3" />
                                Aggiungi Condizione
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={() => onApply(groups)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Applica Filtri
                </button>

                {onSave && (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            placeholder="Nome filtro..."
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                            onClick={() => {
                                if (filterName) {
                                    onSave(filterName, groups);
                                    setFilterName('');
                                }
                            }}
                            disabled={!filterName}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                        >
                            Salva
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
