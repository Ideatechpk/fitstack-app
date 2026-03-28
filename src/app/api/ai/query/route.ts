import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { queryAI, buildDataContext } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { question, conversationHistory } = await request.json();
    if (!question || typeof question !== "string")
      return NextResponse.json({ error: "Question is required" }, { status: 400 });

    // Fetch ALL module data for AI context
    const [contactsRes, projectsRes, invoicesRes, messagesRes] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("projects").select("*, contacts(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*, contacts(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("whatsapp_messages").select("*, contacts(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    ]);

    const contacts = contactsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const whatsappMessages = messagesRes.data || [];

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalContacts: contacts.length,
      contactsThisMonth: contacts.filter(c => new Date(c.created_at) >= thisMonth).length,
      withEmail: contacts.filter(c => c.email).length,
      withPhone: contacts.filter(c => c.phone).length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "active").length,
      completedProjects: projects.filter(p => p.status === "completed").length,
      totalBudget: projects.reduce((s: number, p: any) => s + (parseFloat(p.budget) || 0), 0),
      totalInvoices: invoices.length,
      totalRevenue: invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (parseFloat(i.total) || 0), 0),
      totalOutstanding: invoices.filter((i: any) => ["sent", "overdue"].includes(i.status)).reduce((s: number, i: any) => s + (parseFloat(i.total) || 0), 0),
      overdueInvoices: invoices.filter((i: any) => i.status === "overdue").length,
      totalMessages: whatsappMessages.length,
      recentMessages: whatsappMessages.filter((m: any) => new Date(m.created_at) >= sevenDaysAgo).length,
    };

    const context = buildDataContext({ contacts, projects, invoices, whatsappMessages, stats });

    const result = await queryAI({
      question,
      context,
      conversationHistory: conversationHistory || [],
    });

    // Log conversation
    await supabase.from("ai_conversations").insert({
      user_id: user.id, question, answer: result.answer, tokens_used: String(result.tokensUsed),
    });

    return NextResponse.json({ answer: result.answer, tokensUsed: result.tokensUsed });
  } catch (error: any) {
    console.error("AI query error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI query" }, { status: 500 });
  }
}
