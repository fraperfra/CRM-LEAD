"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'follow_up' | 'new_lead' | 'hot_lead' | 'no_response';
    title: string;
    message: string;
    leadId?: string;
    leadName?: string;
    timestamp: Date;
    read: boolean;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();

        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchNotifications() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch leads for follow-up today
        const { data: followUpLeads } = await supabase
            .from('leads')
            .select('*')
            .is('deleted_at', null)
            .lte('next_follow_up_date', todayStr)
            .limit(5);

        // Fetch leads with no activity in 7 days
        const { data: inactiveLeads } = await supabase
            .from('leads')
            .select('id, nome, last_contact_date')
            .is('deleted_at', null)
            .lt('last_contact_date', sevenDaysAgo.toISOString())
            .limit(3);

        // Fetch HOT leads from today
        const { data: hotLeads } = await supabase
            .from('leads')
            .select('*')
            .is('deleted_at', null)
            .eq('lead_quality', 'HOT')
            .gte('created_at', todayStr)
            .limit(3);

        const notifs: Notification[] = [];

        // Follow-up notifications
        followUpLeads?.forEach(lead => {
            const isOverdue = lead.next_follow_up_date < todayStr;
            notifs.push({
                id: `followup-${lead.id}`,
                type: 'follow_up',
                title: isOverdue ? 'Follow-up scaduto' : 'Follow-up oggi',
                message: `${lead.nome} - da contattare`,
                leadId: lead.id,
                leadName: lead.nome,
                timestamp: new Date(lead.next_follow_up_date),
                read: false,
            });
        });

        // Inactive leads
        inactiveLeads?.forEach(lead => {
            notifs.push({
                id: `inactive-${lead.id}`,
                type: 'no_response',
                title: 'Lead inattivo',
                message: `${lead.nome} non risponde da 7 giorni`,
                leadId: lead.id,
                leadName: lead.nome,
                timestamp: new Date(lead.last_contact_date || lead.created_at),
                read: false,
            });
        });

        // HOT leads
        hotLeads?.forEach(lead => {
            notifs.push({
                id: `hot-${lead.id}`,
                type: 'hot_lead',
                title: 'Nuovo Lead HOT!',
                message: `${lead.nome} - Punteggio: ${lead.punteggio}`,
                leadId: lead.id,
                leadName: lead.nome,
                timestamp: new Date(lead.created_at),
                read: false,
            });
        });

        // Sort by timestamp (most recent first)
        notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
    }

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'follow_up':
                return '📅';
            case 'new_lead':
                return '🆕';
            case 'hot_lead':
                return '🔥';
            case 'no_response':
                return '⚠️';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'follow_up':
                return 'bg-blue-50 border-blue-200';
            case 'new_lead':
                return 'bg-purple-50 border-purple-200';
            case 'hot_lead':
                return 'bg-red-50 border-red-200';
            case 'no_response':
                return 'bg-orange-50 border-orange-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifiche</h3>
                            <span className="text-sm text-gray-500">{unreadCount} non lette</span>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm">Nessuna notifica</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.leadId ? `/dashboard/leads/${notif.leadId}` : '#'}
                                    className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className={`flex items-start gap-3 p-2 rounded-lg border ${getNotificationColor(notif.type)}`}>
                                        <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                            <p className="text-sm text-gray-600">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {notif.timestamp.toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => fetchNotifications()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Aggiorna
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}