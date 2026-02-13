import { NextRequest, NextResponse } from 'next/server';
import { getGmailService } from '@/lib/gmail';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    console.log('🔗 [Gmail Callback] Starting callback handler...');

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the userId passed from auth route

    if (error) {
        console.error('❌ [Gmail Callback] OAuth Error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=${error}`);
    }

    if (!code) {
        console.error('❌ [Gmail Callback] No code provided');
        return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    try {
        console.log('🔄 [Gmail Callback] Exchanging code for tokens...');
        const gmailService = getGmailService();
        const tokens = await gmailService.getTokensFromCode(code);
        console.log('✅ [Gmail Callback] Tokens received');

        // Set credentials to fetch user email
        gmailService.setCredentials(tokens);
        const emailAddress = await gmailService.getUserEmail();
        console.log('📧 [Gmail Callback] User email:', emailAddress);

        // Initialize Admin Client to bypass RLS and find user
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let userId = state;

        if (!userId) {
            console.log('⚠️ [Gmail Callback] No state/userId received, falling back to first admin lookup...');
            // Find the first user to associate tokens with
            const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

            if (userError || !users || users.length === 0) {
                console.error('❌ [Gmail Callback] No users found in Supabase');
                throw new Error('No users found in CRM to splice tokens with');
            }
            userId = users[0].id;
        }

        console.log('👤 [Gmail Callback] Associating with User ID:', userId);

        // Store tokens in database using Admin Client (bypasses RLS)
        console.log('💾 [Gmail Callback] Saving tokens to DB...');
        const { error: dbError } = await supabaseAdmin
            .from('gmail_oauth_tokens')
            .upsert({
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_type: tokens.token_type,
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                email_address: emailAddress,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('❌ [Gmail Callback] Database error:', dbError);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=db_error_check_logs`
            );
        }

        console.log('✅ [Gmail Callback] Success! Redirecting...');
        // Redirect to success page
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_connected=true`
        );
    } catch (error: any) {
        console.error('❌ [Gmail Callback] Exception:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gmail_error=callback_failed`
        );
    }
}
