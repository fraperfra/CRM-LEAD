import { Settings, Mail, MessageSquare, Key, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
                <p className="text-gray-500 mt-1">
                    Configura il CRM e gestisci i template
                </p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Email Templates */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Template Email</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Gestisci i template per le email automatiche
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        Gestisci Template
                    </button>
                </div>

                {/* WhatsApp Templates */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Template WhatsApp</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Gestisci i template per i messaggi WhatsApp
                    </p>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                        Gestisci Template
                    </button>
                </div>

                {/* API Keys */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Key className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Chiavi API</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Configura le integrazioni con servizi esterni
                    </p>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Gmail API</p>
                            <p className="text-xs text-gray-500 mt-1">Configurato</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">WhatsApp Business API</p>
                            <p className="text-xs text-gray-500 mt-1">Da configurare</p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Bell className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Notifiche</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Gestisci le preferenze di notifica
                    </p>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                            <span className="text-sm text-gray-700">Nuovo lead creato</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                            <span className="text-sm text-gray-700">Lead HOT rilevato</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Contratto vinto</span>
                        </label>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <Palette className="w-6 h-6 text-pink-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Aspetto</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Personalizza l'interfaccia del CRM
                    </p>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input type="radio" name="theme" className="w-4 h-4 text-blue-600" defaultChecked />
                            <span className="text-sm text-gray-700">Tema Chiaro</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="radio" name="theme" className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Tema Scuro</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="radio" name="theme" className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Automatico</span>
                        </label>
                    </div>
                </div>

                {/* User Profile */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Settings className="w-6 h-6 text-gray-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Profilo Utente</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Gestisci i dati del tuo profilo
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                                type="text"
                                defaultValue="Francesco Coppola"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                defaultValue="francesco@valutacasa.it"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium">
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
