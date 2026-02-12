import { useState, useEffect } from 'react';
import { Bell, Calendar, MailOpen, AlertTriangle, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDueLeads, Lead } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const loadNotifications = async () => {
            // 1. Get real due leads
            const dueLeads = await fetchDueLeads();

            // 2. Mock some other intelligent alerts
            const mockAlerts = [
                { id: 'sys-1', type: 'inactivity', title: 'Lead freddo', message: 'Nessun contatto con Luigi Bianchi da 7 giorni.', time: '2 ore fa', read: false },
                { id: 'sys-2', type: 'opened', title: 'Email aperta', message: 'Mario Rossi ha visualizzato il preventivo.', time: '10 min fa', read: false }
            ];

            // Combine
            const followUpNotifs = dueLeads.map(l => ({
                id: `lead-${l.id}`,
                type: 'followup',
                title: 'Follow-up Richiesto',
                message: `Contatta ${l.nome} (${l.lead_quality}) oggi.`,
                time: 'Oggi',
                read: false,
                link: `/dashboard/leads/${l.id}`
            }));

            const all = [...mockAlerts, ...followUpNotifs];
            setNotifications(all);
            setUnreadCount(all.filter(n => !n.read).length);
        };

        loadNotifications();
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'followup': return <Calendar size={16} className="text-blue-500" />;
            case 'inactivity': return <Clock size={16} className="text-orange-500" />;
            case 'opened': return <MailOpen size={16} className="text-green-500" />;
            default: return <Bell size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-white/50 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl z-50 overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800 text-sm">Notifiche</h3>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{unreadCount} Nuove</span>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">Nessuna notifica</div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-3 hover:bg-blue-50/50 transition-colors flex gap-3 ${notif.read ? 'opacity-60' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm flex-shrink-0`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                                        <span className="text-[10px] text-gray-400">{notif.time}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                                <button className="text-xs text-blue-600 font-medium hover:underline">Segna tutte come lette</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;