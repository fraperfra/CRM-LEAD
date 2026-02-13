"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase, Notification, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/supabase';
import Link from 'next/link';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotifications();

        // Realtime Subscription
        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    // Optional: Play sound or show toast
                }
            )
            .subscribe();

        // Close dropdown details
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            supabase.removeChannel(subscription);
        };
    }, []);

    async function loadNotifications() {
        const data = await fetchNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
    }

    async function handleMarkAsRead(id: string, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    async function handleMarkAllRead() {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
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
            case 'task':
                return '✅';
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
            case 'task':
                return 'bg-green-50 border-green-200';
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
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-short">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Notifiche</h3>
                            <p className="text-xs text-gray-500">{unreadCount} non lette</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                                Segna tutte lette
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-12 text-center text-gray-500">
                                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm">Nessuna notifica</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`group relative block px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <Link
                                            href={notif.link || (notif.lead_id ? `/dashboard/leads/${notif.lead_id}` : '#')}
                                            onClick={() => {
                                                if (!notif.read) markNotificationAsRead(notif.id);
                                                setIsOpen(false);
                                            }}
                                            className="flex gap-3"
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notif.type).split(' ')[0]}`}>
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(notif.created_at).toLocaleDateString('it-IT')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                            </div>
                                        </Link>

                                        {!notif.read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-gray-400 hover:text-blue-600 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-gray-100"
                                                title="Segna come letta"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                        <Link
                            href="/dashboard/notifications"
                            className="text-xs text-gray-500 hover:text-gray-900"
                            onClick={() => setIsOpen(false)}
                        >
                            Vedi tutte le notifiche
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}