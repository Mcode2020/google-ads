import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // ✅ server-only
);

export async function POST(req: Request) {
    try {
        // 1. Get NextAuth session
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

        // 4. Insert campaign with logged-in user's ID
        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .insert([{ ...body, user_id: user.id }])
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("POST /api/campaigns error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}


// app/api/campaigns/route.ts
export async function GET(req: Request) {
    try {
        // 1. Get NextAuth session
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 2. Get user from Supabase `users` table
        const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Fetch campaigns belonging to the user
        const { data, error } = await supabaseAdmin
            .from("campaigns")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("GET /api/campaigns error:", err);
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        );
    }
}
