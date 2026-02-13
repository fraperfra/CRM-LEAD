

export default function SettingsPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
                <p className="text-gray-600 mt-1">Gestisci integrazioni e preferenze del CRM</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Templates Section */}
                <a href="/dashboard/settings/templates" className="block group">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group-hover:border-blue-300">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-dashed"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Template Messaggi</h3>
                        <p className="text-gray-500 mt-2 text-sm">Crea e gestisci i modelli per Email, WhatsApp e SMS da riutilizzare nelle automazioni.</p>
                    </div>
                </a>

                {/* Account / User Profile (Placeholder) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-60">
                    <div className="h-10 w-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Profilo Utente</h3>
                    <p className="text-gray-500 mt-2 text-sm">Gestisci le tue informazioni personali e la password (Presto disponibile).</p>
                </div>

                {/* Test & Debug */}
                <a href="/dashboard/settings/test" className="block group">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group-hover:border-purple-300">
                        <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flask-conical"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Area Test & Debug</h3>
                        <p className="text-gray-500 mt-2 text-sm">Genera lead finti e testa le automazioni in sicurezza senza sporcare i dati reali.</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
