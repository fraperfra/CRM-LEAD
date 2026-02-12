"use client";

import { useState } from 'react';
import { Activity } from '@/lib/supabase';
import { Mail, MessageSquare, Phone, Calendar, FileText, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ActivityTimelineProps {
  leadId: string;
  activities: Activity[];
}

const activityIcons = {
  email: Mail,
  whatsapp: MessageSquare,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  sms: MessageSquare,
  documento: FileText,
};

const activityColors = {
  email: 'text-blue-600 bg-blue-50',
  whatsapp: 'text-green-600 bg-green-50',
  call: 'text-purple-600 bg-purple-50',
  meeting: 'text-orange-600 bg-orange-50',
  note: 'text-gray-600 bg-gray-50',
  sms: 'text-pink-600 bg-pink-50',
  documento: 'text-indigo-600 bg-indigo-50',
};

export function ActivityTimeline({ leadId, activities }: ActivityTimelineProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as Activity['type'],
    subject: '',
    content: '',
  });

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement server action to add activity
    console.log('Adding activity:', newActivity);

    setNewActivity({ type: 'note', subject: '', content: '' });
    setIsAddingActivity(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Activity Button */}
      {!isAddingActivity ? (
        <button
          onClick={() => setIsAddingActivity(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Attività
        </button>
      ) : (
        <form onSubmit={handleAddActivity} className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={newActivity.type}
              onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as Activity['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="note">Nota</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Chiamata</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oggetto
            </label>
            <input
              type="text"
              value={newActivity.subject}
              onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenuto
            </label>
            <textarea
              value={newActivity.content}
              onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={() => setIsAddingActivity(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nessuna attività registrata
          </p>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons] || FileText;
            const colorClass = activityColors[activity.type as keyof typeof activityColors] || 'text-gray-600 bg-gray-50';

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                    {activity.subject}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {activity.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(activity.created_at)}</span>
                    {activity.status && (
                      <span className={`px-2 py-0.5 rounded-full ${activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}