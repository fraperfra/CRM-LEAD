import { NextRequest, NextResponse } from 'next/server';
import { getGmailService } from '@/lib/gmail';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');
        const gmailService = getGmailService();
        // Pass userId as state to preserve it through the OAuth flow
        const authUrl = gmailService.getAuthUrl(userId || undefined);
        console.log('🔗 [Gmail Auth] Redirecting to:', authUrl);

        // Redirect user to Google OAuth consent screen
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate auth URL' },
            { status: 500 }
        );
    }
}
