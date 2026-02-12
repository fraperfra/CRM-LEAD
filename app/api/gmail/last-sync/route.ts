import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Get user ID (TODO: implement proper auth)
        const userId = 'current-user-id';

        // Get last sync log
        const { data, error } = await supabase
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
