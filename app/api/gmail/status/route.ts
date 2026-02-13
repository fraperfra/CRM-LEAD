import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get user ID 
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({
                connected: false,
                email: null,
                lastSynced: null,
            });
        }
        const userId = user.id;

        // Initialize Admin Client to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if user has connected Gmail
        const { data, error } = await supabaseAdmin
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
