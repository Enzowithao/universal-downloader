'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
    const password = formData.get('password')
    const correctPassword = process.env.APP_PASSWORD

    if (!correctPassword) {
        // Si pas de password configuré, on laisse passer (ou on bloque, au choix)
        // Pour la sécurité, mieux vaut bloquer si pas configuré.
        return { message: 'Erreur de configuration serveur (APP_PASSWORD manquant).' }
    }

    if (password === correctPassword) {
        // 1. Définir le cookie
        (await cookies()).set('auth_token', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 semaine
            path: '/',
        })

        // 2. Rediriger
        redirect('/')
    } else {
        return { message: 'Mot de passe incorrect 🔒' }
    }
}
