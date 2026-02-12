import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Get user ID (TODO: implement proper auth)
        const userId = 'current-user-id';

        // Check if user has connected Gmail
        const { data, error } = await supabase
            .from('gmail_oauth_tokens')
            .select('email_address, is_active, last_synced_at')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return NextResponse.json({
                connected: false,
                email: null,
                lastSynced: null,
            });
        }

        return NextResponse.json({
            connected: true,
            email: data.email_address,
            lastSynced: data.last_synced_at,
        });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({
            connected: false,
            email: null,
            lastSynced: null,
        });
    }
}
