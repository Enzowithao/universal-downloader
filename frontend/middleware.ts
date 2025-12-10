import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Liste des chemins publics (login, assets, fichiers statiques)
    const publicPaths = ['/login', '/logo.svg', '/favicon.ico', '/robots.txt'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path)) ||
        request.nextUrl.pathname.startsWith('/Logos') ||
        request.nextUrl.pathname.startsWith('/_next');

    // 2. Vérification du cookie
    const authToken = request.cookies.get('auth_token');

    // 3. Logique de redirection
    if (!isPublicPath && !authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname === '/login' && authToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
