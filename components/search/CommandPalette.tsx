"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, ArrowRight, FileText, Users, Zap, BarChart3, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    type: 'lead' | 'page' | 'action' | 'recent';
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const router = useRouter();

    // Quick actions
    const quickActions: SearchResult[] = [
        {
            type: 'action',
            id: 'create-lead',
            title: 'Crea Nuovo Lead',
            icon: <Users className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard/leads/new');
                onClose();
            },
        },
        {
            type: 'action',
            id: 'create-automation',
            title: 'Nuova Automazione',
            icon: <Zap className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard/automations/create');
                onClose();
            },
        },
    ];

    // Page navigation
    const pages: SearchResult[] = [
        {
            type: 'page',
            id: 'dashboard',
            title: 'Dashboard',
            subtitle: 'Panoramica generale',
            icon: <BarChart3 className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard');
                onClose();
            },
        },
        {
            type: 'page',
            id: 'leads',
            title: 'Leads',
            subtitle: 'Gestione lead',
            icon: <Users className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard/leads');
                onClose();
            },
        },
        {
            type: 'page',
            id: 'automations',
            title: 'Automazioni',
            subtitle: 'Regole automatiche',
            icon: <Zap className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard/automations');
                onClose();
            },
        },
        {
            type: 'page',
            id: 'analytics',
            title: 'Analytics',
            subtitle: 'Statistiche e report',
            icon: <BarChart3 className="w-4 h-4" />,
            action: () => {
                router.push('/dashboard/analytics');
                onClose();
            },
        },
    ];

    // Search leads
    const searchLeads = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) return [];

        const { data, error } = await supabase
            .from('leads')
            .select('id, nome, email, telefono, lead_quality')
            .or(`nome.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,telefono.ilike.%${searchQuery}%`)
            .limit(5);

        if (error || !data) return [];

        return data.map((lead) => ({
            type: 'lead' as const,
            id: lead.id,
            title: lead.nome,
            subtitle: lead.email || lead.telefono,
            icon: <Users className="w-4 h-4" />,
            action: () => {
                router.push(`/dashboard/leads/${lead.id}`);
                saveSearchHistory(searchQuery);
                onClose();
            },
        }));
    }, [router, onClose]);

    // Perform search
    useEffect(() => {
        async function performSearch() {
            if (!query) {
                // Show quick actions and recent searches
                const recent = recentSearches.slice(0, 3).map((q, idx) => ({
                    type: 'recent' as const,
                    id: `recent-${idx}`,
                    title: q,
                    icon: <Clock className="w-4 h-4" />,
                    action: () => setQuery(q),
                }));
                setResults([...quickActions, ...recent]);
                return;
            }

            // Filter pages
            const filteredPages = pages.filter(
                (page) =>
                    page.title.toLowerCase().includes(query.toLowerCase()) ||
                    page.subtitle?.toLowerCase().includes(query.toLowerCase())
            );

            // Search leads
            const leadResults = await searchLeads(query);

            // Filter actions
            const filteredActions = quickActions.filter((action) =>
                action.title.toLowerCase().includes(query.toLowerCase())
            );

            setResults([...filteredActions, ...filteredPages, ...leadResults]);
            setSelectedIndex(0);
        }

        performSearch();
    }, [query, recentSearches, searchLeads]);

    // Save search to history
    const saveSearchHistory = (searchQuery: string) => {
        const updated = [searchQuery, ...recentSearches.filter((q) => q !== searchQuery)].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem('searchHistory', JSON.stringify(updated));
    };

    // Load search history
    useEffect(() => {
        const stored = localStorage.getItem('searchHistory');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    results[selectedIndex].action();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cerca lead, pagine, azioni..."
                        className="flex-1 text-lg outline-none"
                        autoFocus
                    />
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-300">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Nessun risultato trovato</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {results.map((result, idx) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={result.action}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${idx === selectedIndex
                                            ? 'bg-blue-50 text-blue-900'
                                            : 'hover:bg-gray-50 text-gray-900'
                                        }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium">{result.title}</p>
                                        {result.subtitle && (
                                            <p className="text-sm text-gray-500">{result.subtitle}</p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                    <div className="flex gap-4">
                        <span>
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑↓</kbd> naviga
                        </span>
                        <span>
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">⏎</kbd> seleziona
                        </span>
                    </div>
                    <span>{results.length} risultati</span>
                </div>
            </div>
        </div>
    );
}
