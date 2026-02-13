"use client";

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GmailIntegrationSettings() {
    const [connected, setConnected] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<any>(null);
    const [gmailAccount, setGmailAccount] = useState('');

    useEffect(() => {
        checkConnection();
        fetchLastSync();
    }, []);

    async function checkConnection() {
        try {
            const res = await fetch('/api/gmail/status');
            const data = await res.json();
            setConnected(data.connected);
            setGmailAccount(data.email || '');
        } catch (error) {
            console.error('Error checking Gmail connection:', error);
        }
    }

    async function fetchLastSync() {
        try {
            const res = await fetch('/api/gmail/last-sync');
            const data = await res.json();
            setLastSync(data);
        } catch (error) {
            console.error('Error fetching last sync:', error);
        }
    }

    async function handleConnect() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                window.location.href = `/api/gmail/auth?userId=${user.id}`;
            } else {
                console.error('No user found');
                window.location.href = '/api/gmail/auth';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = '/api/gmail/auth';
        }
    }

    async function handleSync() {
        setSyncing(true);
        try {
            const res = await fetch('/api/gmail/sync', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(`Sync completato!\n\nEmail processate: ${data.summary.emailsProcessed}\nLead creati: ${data.summary.leadsCreated}\nLead aggiornati: ${data.summary.leadsUpdated}`);
                fetchLastSync();
            } else {
                alert('Errore durante il sync');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Errore durante il sync');
        } finally {
            setSyncing(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm('Sei sicuro di voler disconnettere Gmail?')) return;

        try {
            await fetch('/api/gmail/disconnect', { method: 'POST' });
            setConnected(false);
            setGmailAccount('');
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Mail className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Integrazione Gmail</h3>
                        <p className="text-sm text-gray-500">
                            Importa automaticamente lead dalle email del form
                        </p>
                    </div>
                </div>

                {connected ? (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Connesso
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        <XCircle className="w-3 h-3" />
                        Non connesso
                    </div>
                )}
            </div>

            {/* Connected Account */}
            {connected && gmailAccount && (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Account connesso:</p>
                    <p className="font-medium text-gray-900">{gmailAccount}</p>
                </div>
            )}

            {/* Last Sync Stats */}
            {connected && lastSync && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Email</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{lastSync.emails_processed || 0}</p>
                        <p className="text-xs text-blue-600 mt-1">Processate</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Lead Nuovi</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{lastSync.leads_created || 0}</p>
                        <p className="text-xs text-green-600 mt-1">Creati</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Aggiornati</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{lastSync.leads_updated || 0}</p>
                        <p className="text-xs text-purple-600 mt-1">Lead</p>
                    </div>
                </div>
            )}

            {/* Last Sync Time */}
            {connected && lastSync && lastSync.completed_at && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                        Ultimo sync: {new Date(lastSync.completed_at).toLocaleString('it-IT')}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {connected ? (
                    <>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Disconnetti
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <Mail className="w-5 h-5" />
                        Connetti Gmail
                    </button>
                )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Come funziona:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Connetti il tuo account Gmail</li>
                    <li>Le email del form vengono lette automaticamente</li>
                    <li>I dati vengono estratti e i lead creati/aggiornati</li>
                    <li>Ogni email diventa un'attività nel timeline del lead</li>
                    <li>Le email processate vengono contrassegnate come lette</li>
                </ol>
            </div>
        </div>
    );
}
