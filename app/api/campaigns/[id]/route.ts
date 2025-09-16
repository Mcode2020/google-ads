// app/api/campaigns/[id]/route.ts
import { NextResponse, NextRequest, NextFetchEvent } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from '../../auth/[...nextauth]/route';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: get logged-in user ID from session
async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Not authenticated");

    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .single();

    if (error || !user) throw new Error("User not found");
    return user.id;
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const campaignId = (await context.params).id;
        const userId = await getUserId();

        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .update(body)
            .eq("id", campaignId)
            .eq("user_id", userId)
            .select();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        if (!data || data.length === 0)
            return NextResponse.json({ error: "Campaign not found or not authorized" }, { status: 404 });

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("PATCH /api/campaigns/[id] error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const campaignId = (await context.params).id;
        const userId = await getUserId();

        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .select("*")
            .eq("id", campaignId)
            .eq("user_id", userId)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        if (!data) return NextResponse.json({ error: "Campaign not found or not authorized" }, { status: 404 });

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("GET /api/campaigns/[id] error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
