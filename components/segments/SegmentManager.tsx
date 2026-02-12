"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Target, TrendingUp, Zap, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface Segment {
    id: string;
    name: string;
    description: string;
    color: string;
    segment_type: 'smart' | 'manual';
    lead_count: number;
    rules: any;
}

export default function SegmentManager() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSegments();
    }, []);

    async function fetchSegments() {
        const { data, error } = await supabase
            .from('lead_segments')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSegments(data);
        }
        setLoading(false);
    }

    async function deleteSegment(id: string) {
        if (!confirm('Sei sicuro di voler eliminare questo segmento?')) return;

        await supabase.from('lead_segments').delete().eq('id', id);
        fetchSegments();
    }

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            red: 'bg-red-100 text-red-700 border-red-200',
            orange: 'bg-orange-100 text-orange-700 border-orange-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            purple: 'bg-purple-100 text-purple-700 border-purple-200',
            gray: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[color] || colors.gray;
    };

    const getIcon = (type: string) => {
        return type === 'smart' ? <Zap className="w-5 h-5" /> : <Users className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Segmenti Lead</h2>
                    <p className="text-gray-500 mt-1">
                        Organizza i tuoi lead in segmenti per azioni mirate
                    </p>
                </div>
                <Link
                    href="/dashboard/segments/create"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Nuovo Segmento
                </Link>
            </div>

            {/* Segments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.map((segment) => (
                    <div
                        key={segment.id}
                        className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-all ${getColorClass(segment.color)
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getColorClass(segment.color)}`}>
                                    {getIcon(segment.segment_type)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                                        {segment.segment_type === 'smart' ? 'Smart Segment' : 'Manual Segment'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {segment.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-white/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Lead</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{segment.lead_count}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard/leads?segment=${segment.id}`}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium border border-gray-200"
                            >
                                <Target className="w-4 h-4" />
                                Vedi Lead
                            </Link>
                            <button
                                onClick={() => deleteSegment(segment.id)}
                                className="p-2 bg-white text-red-600 rounded-md hover:bg-red-50 border border-red-200"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {segments.length === 0 && (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Nessun segmento creato</p>
                    <Link
                        href="/dashboard/segments/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Crea Primo Segmento
                    </Link>
                </div>
            )}
        </div>
    );
}
