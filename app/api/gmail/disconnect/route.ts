import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Get user ID (TODO: implement proper auth)
        const userId = 'current-user-id';

        // Deactivate tokens
        const { error } = await supabase
            .from('gmail_oauth_tokens')
            .update({ is_active: false })
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json(
            { error: 'Failed to disconnect Gmail' },
            { status: 500 }
        );
    }
}
