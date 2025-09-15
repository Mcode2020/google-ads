// app/api/campaigns/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const campaignId = params.id;
        console.log(campaignId, "==================");

        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const body = await req.json();

        // Update the campaign only if it belongs to the logged-in user
        const { data, error } = await supabaseAdmin
            .from('campaigns')
            .update(body)
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .select();
        console.log(data, error, "==================");
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        if (!data || data.length === 0) return NextResponse.json({ error: 'Campaign not found or not authorized' }, { status: 404 });

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
