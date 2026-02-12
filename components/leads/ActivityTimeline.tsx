import { useState } from 'react';
import { Activity } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import { Mail, Phone, MessageSquare, StickyNote, Users, Plus } from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'lead_id'>) => void;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, onAddActivity }) => {
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<'email' | 'whatsapp' | 'call' | 'meeting' | 'note'>('note');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddActivity({
      type: newType,
      subject: subject || (newType === 'note' ? 'Nota rapida' : 'Nuova attività'),
      content,
      status: 'completed'
    });
    setSubject('');
    setContent('');
    setShowForm(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'call': return <Phone className="h-4 w-4 text-purple-500" />;
      case 'meeting': return <Users className="h-4 w-4 text-orange-500" />;
      case 'note': return <StickyNote className="h-4 w-4 text-yellow-500" />;
      default: return <StickyNote className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Timeline Attività</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="note">Nota</option>
                <option value="call">Chiamata</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Oggetto dell'attività"
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dettagli..."
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Salva Attività
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="relative space-y-8 pl-4 before:absolute before:left-[11px] before:top-2 before:h-full before:w-0.5 before:bg-gray-200">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm italic pl-4">Nessuna attività registrata.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="relative pl-6">
              <span className="absolute left-[-13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white border border-gray-200 shadow-sm">
                {getIcon(activity.type)}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{activity.subject}</span>
                  <span className="text-xs text-gray-500">• {formatDate(activity.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                  {activity.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;