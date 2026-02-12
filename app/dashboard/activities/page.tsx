import { supabase } from '@/lib/supabase';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { Mail, Phone, MessageSquare, Calendar, FileText, Filter } from 'lucide-react';

export const revalidate = 30;

async function getActivities() {
    const { data: activities, error } = await supabase
        .from('activities')
        .select(`
      *,
      lead:leads(nome, email)
    `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching activities:', error);
        return [];
    }

    return activities || [];
}

async function getActivityStats() {
    const { data: activities } = await supabase
        .from('activities')
        .select('type');

    const stats = {
        total: activities?.length || 0,
        email: activities?.filter(a => a.type === 'email').length || 0,
        whatsapp: activities?.filter(a => a.type === 'whatsapp').length || 0,
        call: activities?.filter(a => a.type === 'call').length || 0,
        meeting: activities?.filter(a => a.type === 'meeting').length || 0,
        note: activities?.filter(a => a.type === 'note').length || 0,
    };

    return stats;
}

export default async function ActivitiesPage() {
    const [activities, stats] = await Promise.all([
        getActivities(),
        getActivityStats()
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Attività</h1>
                <p className="text-gray-500 mt-1">
                    Tutte le attività di contatto con i lead
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-500">Totale</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-medium text-gray-500">Email</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.email}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.whatsapp}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-medium text-gray-500">Chiamate</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.call}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <p className="text-sm font-medium text-gray-500">Meeting</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.meeting}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-500">Note</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-600">{stats.note}</p>
                </div>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Cronologia Attività</h2>
                </div>

                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nessuna attività trovata</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity: any) => (
                            <div
                                key={activity.id}
                                className="border-l-4 border-blue-200 pl-4 py-3 hover:bg-gray-50 rounded-r-lg transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {activity.type === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                                            {activity.type === 'whatsapp' && <MessageSquare className="w-5 h-5 text-green-600" />}
                                            {activity.type === 'call' && <Phone className="w-5 h-5 text-purple-600" />}
                                            {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-orange-600" />}
                                            {activity.type === 'note' && <FileText className="w-5 h-5 text-gray-600" />}

                                            <h3 className="font-semibold text-gray-900">{activity.subject}</h3>
                                        </div>

                                        <p className="text-gray-700 mb-2">{activity.content}</p>

                                        {activity.lead && (
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>Lead: <span className="font-medium text-gray-900">{activity.lead.nome}</span></span>
                                                <span>{new Date(activity.created_at).toLocaleString('it-IT')}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        activity.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
