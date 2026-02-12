import { NextRequest, NextResponse } from 'next/server';
import { getGmailService } from '@/lib/gmail';

export async function GET(request: NextRequest) {
    try {
        const gmailService = getGmailService();
        const authUrl = gmailService.getAuthUrl();

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
