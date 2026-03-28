import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Use service role key to bypass RLS (portal tokens are accessed by external clients)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find token
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("portal_tokens").select("*").eq("token", token).eq("is_active", true).single();

  if (tokenError || !tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 404 });
  }

  // Update last accessed
  await supabase.from("portal_tokens").update({ last_accessed_at: new Date().toISOString() }).eq("id", tokenRecord.id);

  // Fetch contact
  const { data: contact } = await supabase.from("contacts").select("*").eq("id", tokenRecord.contact_id).single();
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  // Fetch projects for this contact
  const { data: projects } = await supabase.from("projects").select("id, name, status, priority, due_date, budget, description")
    .eq("contact_id", tokenRecord.contact_id).eq("user_id", tokenRecord.user_id).order("created_at", { ascending: false });

  // Fetch invoices for this contact
  const { data: invoices } = await supabase.from("invoices").select("id, invoice_number, status, total, currency, issue_date, due_date, items")
    .eq("contact_id", tokenRecord.contact_id).eq("user_id", tokenRecord.user_id).order("created_at", { ascending: false });

  // Fetch tasks linked to contact's projects
  const projectIds = (projects || []).map(p => p.id);
  let tasks: any[] = [];
  if (projectIds.length > 0) {
    const { data: t } = await supabase.from("tasks").select("id, title, status, priority, due_date, projects(name)")
      .in("project_id", projectIds).eq("user_id", tokenRecord.user_id).order("created_at", { ascending: false });
    tasks = t || [];
  }

  return NextResponse.json({
    contact: { full_name: contact.full_name, company: contact.company, email: contact.email },
    projects: projects || [],
    invoices: invoices || [],
    tasks,
  });
}
