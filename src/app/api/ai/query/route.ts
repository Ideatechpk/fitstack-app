import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { queryAI, buildDataContext } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, conversationHistory } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Fetch contacts for context
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Build stats
    const allContacts = contacts || [];
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalContacts: allContacts.length,
      contactsThisMonth: allContacts.filter(c => new Date(c.created_at) >= thisMonth).length,
      withEmail: allContacts.filter(c => c.email).length,
      withPhone: allContacts.filter(c => c.phone).length,
      mostRecent: allContacts.length > 0
        ? `${allContacts[0].full_name} (${new Date(allContacts[0].created_at).toLocaleDateString()})`
        : "None",
    };

    const context = buildDataContext(allContacts, stats);

    // Query AI
    const result = await queryAI({
      question,
      context,
      conversationHistory: conversationHistory || [],
    });

    // Log conversation
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      question,
      answer: result.answer,
      tokens_used: String(result.tokensUsed),
    });

    return NextResponse.json({
      answer: result.answer,
      tokensUsed: result.tokensUsed,
    });
  } catch (error: any) {
    console.error("AI query error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI query" },
      { status: 500 }
    );
  }
}
