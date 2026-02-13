'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

export default function AuthPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

    const router = useRouter()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            // Use Client Component Client to access/set cookies correctly
            const supabase = createClientComponentClient()

            let error;

            if (view === 'sign-in') {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
                error = signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                })
                error = signUpError;
            }

            if (error) {
                setMessage({ text: error.message, type: 'error' })
            } else {
                if (view === 'sign-up') {
                    setMessage({ text: 'Registrazione completata! Controlla la tua email per confermare, oppure prova ad accedere.', type: 'success' })
                    setView('sign-in')
                } else {
                    setMessage({ text: 'Login effettuato! Reindirizzamento...', type: 'success' })
                    router.refresh()
                    router.replace('/dashboard')
                }
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'Errore sconosciuto', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white shadow-xl relative z-10 w-full">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ValutaCasa CRM
                        </h1>
                        <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
                            {view === 'sign-in' ? 'Bentornato!' : 'Crea il tuo account'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {view === 'sign-in' ? 'Accedi per gestire i tuoi lead e le stime.' : 'Inizia a gestire la tua agenzia in modo intelligente.'}
                        </p>
                    </div>

                    <div className="flex gap-4 p-1 bg-gray-100/80 rounded-xl mb-8">
                        <button
                            onClick={() => { setView('sign-in'); setMessage(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${view === 'sign-in' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Accedi
                        </button>
                        <button
                            onClick={() => { setView('sign-up'); setMessage(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${view === 'sign-up' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Registrati
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-gray-50/30"
                                    placeholder="nome@esempio.com"
                                />
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Password
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={view === 'sign-in' ? 'current-password' : 'new-password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-gray-50/30"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg text-sm flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                {message.type === 'success' ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 shrink-0 text-red-500">⚠️</div>}
                                {message.text}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {view === 'sign-in' ? 'Accedi al CRM' : 'Crea Account'}
                                {!loading && <ArrowRight className="h-4 w-4 opacity-80" />}
                            </button>
                        </div>

                        {view === 'sign-in' && (
                            <div className="text-center">
                                <a href="#" className="text-xs text-blue-600 hover:text-blue-500 font-medium">
                                    Password dimenticata?
                                </a>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
