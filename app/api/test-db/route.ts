import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            return NextResponse.json({ success: false, error: error.message });
        }

        return NextResponse.json({
            success: true,
            userCount: data.users.length,
            users: data.users.map(u => ({ id: u.id, email: u.email }))
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
