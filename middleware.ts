import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareSupabaseClient({ req, res })

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

    if (isDashboard && !session) {
        // Redirect to login if trying to access dashboard without valid session
        return NextResponse.redirect(new URL('/auth', req.url))
    }

    if (isAuthPage && session) {
        // Redirect to dashboard if already logged in
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth'],
}
