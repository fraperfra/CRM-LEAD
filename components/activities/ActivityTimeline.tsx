"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, Mail, Calendar, FileText, MessageCircle, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    outcome?: string;
    duration_minutes?: number;
    completed_at: string;
    created_at: string;
    metadata?: any;
}

interface ActivityTimelineProps {
    leadId: string;
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddActivity, setShowAddActivity] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, [leadId]);

    async function fetchActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setActivities(data);
        }
        setLoading(false);
    }

    const getActivityIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            call: <Phone className="w-4 h-4" />,
            email: <Mail className="w-4 h-4" />,
            meeting: <Calendar className="w-4 h-4" />,
            note: <FileText className="w-4 h-4" />,
            whatsapp: <MessageCircle className="w-4 h-4" />,
            status_change: <TrendingUp className="w-4 h-4" />,
        };
        return icons[type] || <FileText className="w-4 h-4" />;
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            call: 'bg-blue-100 text-blue-600',
            email: 'bg-purple-100 text-purple-600',
            meeting: 'bg-green-100 text-green-600',
            note: 'bg-gray-100 text-gray-600',
            whatsapp: 'bg-emerald-100 text-emerald-600',
            status_change: 'bg-orange-100 text-orange-600',
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Timeline Attività</h3>
                <button
                    onClick={() => setShowAddActivity(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Aggiungi
                </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>Nessuna attività registrata</p>
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative">
                            {/* Timeline Line */}
                            {index !== activities.length - 1 && (
                                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                            )}

                            {/* Activity Item */}
                            <div className="flex gap-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                            {activity.outcome && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                    {activity.outcome}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(activity.created_at), 'dd MMM yyyy, HH:mm', { locale: it })}
                                        </span>
                                    </div>

                                    {activity.description && (
                                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                    )}

                                    {activity.duration_minutes && (
                                        <p className="text-xs text-gray-500">
                                            Durata: {activity.duration_minutes} minuti
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
