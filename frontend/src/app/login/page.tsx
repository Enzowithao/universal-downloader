'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from './actions'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

const initialState = {
    message: '',
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
            {pending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    <span>Déverrouiller</span>
                    <Lock size={18} className="group-hover:rotate-12 transition-transform" />
                </>
            )}
        </button>
    )
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState)

    return (
        <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">

            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Accès Sécurisé</h1>
                    <p className="text-neutral-400 text-center mt-2 text-sm">
                        Veuillez entrer le mot de passe administrateur pour accéder au Universal Downloader.
                    </p>
                </div>

                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="password"
                            name="password"
                            placeholder="Mot de passe confidentiel"
                            required
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 min-h-[50px] outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-center tracking-widest placeholder:tracking-normal placeholder:text-neutral-600"
                        />
                    </div>

                    <SubmitButton />

                    {state?.message && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm text-center mt-4 bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                        >
                            {state.message}
                        </motion.p>
                    )}
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-neutral-600">
                        Protégé par Antigravity Security System
                    </p>
                </div>

            </motion.div>
        </main>
    )
}
