import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const pathname = req.nextUrl.pathname

    console.log(`[Middleware] Processing request for: ${pathname}`)
    console.log(`[Middleware] Cookies present: ${req.cookies.getAll().map(c => c.name).join(', ')}`)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    res.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    res.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()

    console.log(`[Middleware] Session check result:`, {
        hasSession: !!session,
        user: session?.user?.email,
        error: error?.message
    })

    const isDashboard = pathname.startsWith('/dashboard')
    const isAuthPage = pathname.startsWith('/auth')

    if (isDashboard && !session) {
        console.log('[Middleware] No session for dashboard, normally would redirect to /auth')
        // TEMPORARY DEBUG: Allow info to pass to client to diagnose
        res.headers.set('X-Middleware-Session', 'none')
        // return NextResponse.redirect(new URL('/auth', req.url))
    } else if (session) {
        res.headers.set('X-Middleware-Session', 'active')
        res.headers.set('X-Middleware-User', session.user.email || 'unknown')
    }

    if (isAuthPage && session) {
        console.log('[Middleware] Session active on auth page, redirecting to /dashboard')
        // Keep this redirect as it's less critical/dangerous
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth'],
}
