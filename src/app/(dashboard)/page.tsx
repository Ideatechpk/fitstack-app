import { createServerSupabase } from "@/lib/supabase/server";
import { Users, FolderKanban, Receipt, DollarSign, TrendingUp, AlertTriangle, MessageCircle, UserPlus } from "lucide-react";
import { StatCard } from "@/components/data/stat-card";
import { AIQueryPanel } from "@/components/ai/query-panel";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel data fetching
  const [contactsR, projectsR, invoicesR, recentContactsR, recentProjectsR, overdueR] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active"),
    supabase.from("invoices").select("total, status").eq("user_id", user!.id),
    supabase.from("contacts").select("id, full_name, company, email, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("projects").select("id, name, status, priority, due_date, contacts(full_name)").eq("user_id", user!.id).eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase.from("invoices").select("id, invoice_number, total, due_date, status, contacts(full_name)").eq("user_id", user!.id).in("status", ["sent", "overdue"]).order("due_date", { ascending: true }).limit(5),
  ]);

  const totalContacts = contactsR.count || 0;
  const activeProjects = projectsR.count || 0;
  const allInvoices = invoicesR.data || [];
  const totalRevenue = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0);
  const totalOutstanding = allInvoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + parseFloat(i.total), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your operations at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={totalContacts} icon={Users} subtitle="All time" />
        <StatCard title="Active Projects" value={activeProjects} icon={FolderKanban}
          trend={activeProjects > 0 ? { value: `${activeProjects} in progress`, positive: true } : undefined} />
        <StatCard title="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign}
          subtitle="Paid invoices" />
        <StatCard title="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} icon={TrendingUp}
          subtitle="Unpaid invoices" trend={totalOutstanding > 0 ? { value: "Needs attention", positive: false } : undefined} />
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Contacts */}
        <div className="bg-surface border border-white/5 rounded-xl">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Recent Contacts</h3>
            <Link href="/contacts" className="text-xs text-brand-green hover:text-brand-green-light transition">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {(!recentContactsR.data || recentContactsR.data.length === 0) ? (
              <div className="p-8 text-center">
                <UserPlus className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No contacts yet</p>
                <Link href="/contacts" className="text-brand-green text-xs hover:underline mt-1 inline-block">Add first contact →</Link>
              </div>
            ) : recentContactsR.data.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-green">{c.full_name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company || c.email || "No details"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-surface border border-white/5 rounded-xl">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Active Projects</h3>
            <Link href="/projects" className="text-xs text-brand-green hover:text-brand-green-light transition">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {(!recentProjectsR.data || recentProjectsR.data.length === 0) ? (
              <div className="p-8 text-center">
                <FolderKanban className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No active projects</p>
                <Link href="/projects" className="text-brand-green text-xs hover:underline mt-1 inline-block">Create project →</Link>
              </div>
            ) : recentProjectsR.data.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-3.5 h-3.5 text-brand-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.contacts?.full_name || "No client"} · <span className={`badge-${p.priority}`}>{p.priority}</span>
                  </p>
                </div>
                {p.due_date && (
                  <span className="text-[10px] text-gray-500">
                    {new Date(p.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-surface border border-white/5 rounded-xl">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Outstanding Invoices</h3>
            <Link href="/invoices" className="text-xs text-brand-green hover:text-brand-green-light transition">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {(!overdueR.data || overdueR.data.length === 0) ? (
              <div className="p-8 text-center">
                <Receipt className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No outstanding invoices</p>
              </div>
            ) : overdueR.data.map((inv: any) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${inv.status === "overdue" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
                  {inv.status === "overdue" ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <Receipt className="w-3.5 h-3.5 text-yellow-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-500 truncate">{inv.contacts?.full_name || "No client"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${parseFloat(inv.total).toLocaleString()}</p>
                  <p className={`text-[10px] ${inv.status === "overdue" ? "text-red-400" : "text-yellow-400"}`}>
                    {inv.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Panel — full width */}
      <AIQueryPanel />
    </div>
  );
}
