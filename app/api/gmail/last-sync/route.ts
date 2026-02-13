import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(null);
        }
        const userId = user.id;

        // Initialize Admin Client to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get last sync log
        const { data, error } = await supabaseAdmin
            .from('email_sync_log')
            .select('*')
            .eq('triggered_by', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return NextResponse.json(null);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Last sync fetch error:', error);
        return NextResponse.json(null);
    }
}
