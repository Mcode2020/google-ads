import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // ✅ server-only
);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Missing token" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const body = await req.json();
        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .insert([{ ...body, user_id: user.id }])
            .select();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ data });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}


// app/api/campaigns/route.ts
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json(data);
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
