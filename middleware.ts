import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // Manual cookie check because @supabase/auth-helpers-nextjs is acting up
    // We check for the standard Supabase auth token
    // The token name typically includes the project reference

    const allCookies = req.cookies.getAll();
    const hasAuthToken = allCookies.some(cookie =>
        cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );

    // Simple protection logic
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    if (isDashboard && !hasAuthToken) {
        // Redirect to login if trying to access dashboard without token
        const url = req.nextUrl.clone();
        url.pathname = '/auth';
        return NextResponse.redirect(url);
    }

    if (isAuthPage && hasAuthToken) {
        // Redirect to dashboard if trying to access auth page while logged in
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth'],
};
