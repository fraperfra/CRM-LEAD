"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Trash2, Edit, Plus } from 'lucide-react';

interface SavedFilter {
    id: string;
    name: string;
    description?: string;
    filters: any;
    is_favorite: boolean;
    usage_count: number;
}

interface SavedFiltersBarProps {
    onFilterSelect: (filters: any) => void;
}

export default function SavedFiltersBar({ onFilterSelect }: SavedFiltersBarProps) {
    const [filters, setFilters] = useState<SavedFilter[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchSavedFilters();
    }, []);

    async function fetchSavedFilters() {
        const { data, error } = await supabase
            .from('saved_filters')
            .select('*')
            .order('is_favorite', { ascending: false })
            .order('usage_count', { ascending: false });

        if (!error && data) {
            setFilters(data);
        }
    }

    async function applyFilter(filter: SavedFilter) {
        // Update usage count
        await supabase
            .from('saved_filters')
            .update({
                usage_count: filter.usage_count + 1,
                last_used_at: new Date().toISOString(),
            })
            .eq('id', filter.id);

        onFilterSelect(filter.filters);
        fetchSavedFilters();
    }

    async function toggleFavorite(filterId: string, currentState: boolean) {
        await supabase
            .from('saved_filters')
            .update({ is_favorite: !currentState })
            .eq('id', filterId);

        fetchSavedFilters();
    }

    async function deleteFilter(filterId: string) {
        if (!confirm('Sei sicuro di voler eliminare questo filtro salvato?')) return;

        await supabase.from('saved_filters').delete().eq('id', filterId);
        fetchSavedFilters();
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filtri Salvati</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                    <Plus className="w-3 h-3" />
                    Salva Filtro
                </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {filters.slice(0, 8).map((filter) => (
                    <div
                        key={filter.id}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-blue-300 transition-colors"
                    >
                        <button
                            onClick={() => toggleFavorite(filter.id, filter.is_favorite)}
                            className="flex-shrink-0"
                        >
                            <Star
                                className={`w-3 h-3 ${filter.is_favorite
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-400 hover:text-yellow-400'
                                    }`}
                            />
                        </button>

                        <button
                            onClick={() => applyFilter(filter)}
                            className="flex-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                        >
                            {filter.name}
                        </button>

                        <div className="hidden group-hover:flex items-center gap-1">
                            <button
                                onClick={() => deleteFilter(filter.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        {filter.usage_count > 0 && (
                            <span className="text-xs text-gray-400">{filter.usage_count}</span>
                        )}
                    </div>
                ))}
            </div>

            {filters.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                    Nessun filtro salvato. Crea il tuo primo filtro per accesso rapido!
                </p>
            )}
        </div>
    );
}
