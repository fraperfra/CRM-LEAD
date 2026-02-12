import { NextRequest, NextResponse } from 'next/server';
import { getGmailService } from '@/lib/gmail';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=${error}`
            );
        }

        if (!code) {
            return NextResponse.json(
                { error: 'No authorization code provided' },
                { status: 400 }
            );
        }

        // Exchange code for tokens
        const gmailService = getGmailService();
        const tokens = await gmailService.getTokensFromCode(code);

        // Set credentials to fetch user email
        gmailService.setCredentials(tokens);
        const emailAddress = await gmailService.getUserEmail();

        // Get current user (you'll need to implement proper auth)
        // For now, we'll use a placeholder
        const userId = 'current-user-id'; // TODO: Get from session/auth

        // Store tokens in database
        const { error: dbError } = await supabase
            .from('gmail_oauth_tokens')
            .upsert({
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_type: tokens.token_type,
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                email_address: emailAddress,
                is_active: true,
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=db_error`
            );
        }

        // Redirect to success page
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_connected=true`
        );
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=callback_failed`
        );
    }
}
