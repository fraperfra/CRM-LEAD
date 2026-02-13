import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    console.log(`[Middleware] EMERGENCY PASS-THROUGH for: ${req.nextUrl.pathname}`)
    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth'],
}
