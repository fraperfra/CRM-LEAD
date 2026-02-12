"use client";

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface LeadFiltersProps {
    onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
    search: string;
    status: string;
    quality: string;
    tipologia: string;
}

const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    { value: 'nuovo', label: 'Nuovo' },
    { value: 'contattato', label: 'Contattato' },
    { value: 'qualificato', label: 'Qualificato' },
    { value: 'in_trattativa', label: 'In trattativa' },
    { value: 'vinto', label: 'Vinto' },
    { value: 'perso', label: 'Perso' },
];

const qualityOptions = [
    { value: '', label: 'Tutte le qualità' },
    { value: 'HOT', label: 'HOT' },
    { value: 'WARM', label: 'WARM' },
    { value: 'COLD', label: 'COLD' },
];

const tipologiaOptions = [
    { value: '', label: 'Tutti i tipi' },
    { value: 'appartamento', label: 'Appartamento' },
    { value: 'casa_indipendente', label: 'Casa Indipendente' },
    { value: 'villa', label: 'Villa' },
    { value: 'attico', label: 'Attico' },
    { value: 'loft', label: 'Loft' },
    { value: 'ufficio', label: 'Ufficio' },
    { value: 'negozio', label: 'Negozio' },
    { value: 'terreno', label: 'Terreno' },
];

export function LeadFilters({ onFilterChange }: LeadFiltersProps) {
    const [filters, setFilters] = useState<FilterValues>({
        search: '',
        status: '',
        quality: '',
        tipologia: '',
    });

    const handleFilterChange = (field: keyof FilterValues, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            search: '',
            status: '',
            quality: '',
            tipologia: '',
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filtri</h3>
            </div>

            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca per nome, email o telefono..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Filter Dropdowns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stato
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quality Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Qualità
                        </label>
                        <select
                            value={filters.quality}
                            onChange={(e) => handleFilterChange('quality', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {qualityOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipologia Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipologia
                        </label>
                        <select
                            value={filters.tipologia}
                            onChange={(e) => handleFilterChange('tipologia', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            {tipologiaOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Cancella tutti i filtri
                    </button>
                )}
            </div>
        </div>
    );
}
