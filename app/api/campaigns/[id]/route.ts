// app/api/campaigns/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from '../../auth/[...nextauth]/route';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        // 1. Get session from NextAuth
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 2. Find user in Supabase `users` table
        const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Parse request body
        const body = await req.json();

        // 4. Update campaign if it belongs to logged-in user
        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .update(body)
            .eq("id", campaignId)
            .eq("user_id", user.id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Campaign not found or not authorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("PATCH /api/campaigns/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        // 1. Get session from NextAuth
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 2. Find user in Supabase `users` table
        const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Fetch campaign if it belongs to logged-in user
        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .select("*")
            .eq("id", campaignId)
            .eq("user_id", user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json(
                { error: "Campaign not found or not authorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("GET /api/campaigns/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}
