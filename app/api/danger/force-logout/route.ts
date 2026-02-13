import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Create response that redirects to login
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Clear all cookies found
    allCookies.forEach(cookie => {
        response.cookies.delete(cookie.name);
    });

    // Force clear specific known Supabase cookies patterns just in case
    response.cookies.delete('sb-nfgvwqjpldsupsqfewez-auth-token'); // Vecchio progetto
    response.cookies.delete('sb-zqpbpjkcmfpqtjkezmyd-auth-token'); // Nuovo progetto

    return response;
}
