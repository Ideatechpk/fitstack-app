import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contact_id } = await request.json();
  if (!contact_id) return NextResponse.json({ error: "contact_id required" }, { status: 400 });

  // Check if token already exists for this contact
  const { data: existing } = await supabase.from("portal_tokens")
    .select("token").eq("contact_id", contact_id).eq("user_id", user.id).eq("is_active", true).single();

  if (existing) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({ token: existing.token, url: `${appUrl}/portal/${existing.token}` });
  }

  // Generate new token
  const token = randomBytes(32).toString("hex");

  const { error } = await supabase.from("portal_tokens").insert({
    user_id: user.id, contact_id, token,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({ token, url: `${appUrl}/portal/${token}` });
}
