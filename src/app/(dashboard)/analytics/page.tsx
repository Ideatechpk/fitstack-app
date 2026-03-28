"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, PieChart, Users, DollarSign, FolderKanban, CheckSquare, Receipt } from "lucide-react";

interface ChartData { label: string; value: number; color?: string; }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [contactsR, projectsR, invoicesR, tasksR] = await Promise.all([
      supabase.from("contacts").select("created_at, company, tags, status").eq("user_id", user.id),
      supabase.from("projects").select("status, priority, budget, spent, created_at").eq("user_id", user.id),
      supabase.from("invoices").select("status, total, currency, issue_date, paid_at, created_at").eq("user_id", user.id),
      supabase.from("tasks").select("status, priority, due_date, completed_at, created_at").eq("user_id", user.id),
    ]);

    const contacts = contactsR.data || [];
    const projects = projectsR.data || [];
    const invoices = invoicesR.data || [];
    const tasks = tasksR.data || [];

    // Revenue by month (last 6 months)
    const months: ChartData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const rev = invoices
        .filter(inv => inv.status === "paid" && inv.paid_at &&
          new Date(inv.paid_at) >= monthStart && new Date(inv.paid_at) <= monthEnd)
        .reduce((s, inv) => s + parseFloat(inv.total), 0);
      months.push({ label: monthLabel, value: rev });
    }
    const maxRev = Math.max(...months.map(m => m.value), 1);

    // Project status breakdown
    const projectStatus = [
      { label: "Active", value: projects.filter(p => p.status === "active").length, color: "#22c55e" },
      { label: "On Hold", value: projects.filter(p => p.status === "on_hold").length, color: "#f59e0b" },
      { label: "Completed", value: projects.filter(p => p.status === "completed").length, color: "#3b82f6" },
      { label: "Cancelled", value: projects.filter(p => p.status === "cancelled").length, color: "#ef4444" },
    ].filter(s => s.value > 0);

    // Invoice status
    const invoiceStatus = [
      { label: "Paid", value: invoices.filter(i => i.status === "paid").length, color: "#22c55e" },
      { label: "Sent", value: invoices.filter(i => i.status === "sent").length, color: "#3b82f6" },
      { label: "Draft", value: invoices.filter(i => i.status === "draft").length, color: "#6b7280" },
      { label: "Overdue", value: invoices.filter(i => i.status === "overdue").length, color: "#ef4444" },
    ].filter(s => s.value > 0);

    // Task completion
    const taskStatus = [
      { label: "To Do", value: tasks.filter(t => t.status === "todo").length, color: "#6b7280" },
      { label: "In Progress", value: tasks.filter(t => t.status === "in_progress").length, color: "#f59e0b" },
      { label: "Done", value: tasks.filter(t => t.status === "done").length, color: "#22c55e" },
    ].filter(s => s.value > 0);

    // Contact growth (last 6 months)
    const contactGrowth: ChartData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = contacts.filter(c => new Date(c.created_at) <= monthEnd).length;
      contactGrowth.push({ label: monthLabel, value: count });
    }
    const maxContacts = Math.max(...contactGrowth.map(m => m.value), 1);

    // Top companies
    const companyMap: Record<string, number> = {};
    contacts.forEach(c => { if (c.company) companyMap[c.company] = (companyMap[c.company] || 0) + 1; });
    const topCompanies = Object.entries(companyMap).sort(([,a],[,b]) => b - a).slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    // Summary numbers
    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0);
    const outstanding = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + parseFloat(i.total), 0);
    const totalBudget = projects.reduce((s, p) => s + (parseFloat(p.budget) || 0), 0);
    const tasksDone = tasks.filter(t => t.status === "done").length;
    const tasksTotal = tasks.length;

    setData({
      months, maxRev, projectStatus, invoiceStatus, taskStatus,
      contactGrowth, maxContacts, topCompanies,
      summary: {
        contacts: contacts.length, projects: projects.length,
        invoices: invoices.length, tasks: tasksTotal,
        totalRevenue, outstanding, totalBudget,
        taskCompletion: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0,
      },
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return (
    <div className="max-w-6xl mx-auto p-12 text-center">
      <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!data) return null;
  const { months, maxRev, projectStatus, invoiceStatus, taskStatus, contactGrowth, maxContacts, topCompanies, summary } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Business performance at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, sub: `$${summary.outstanding.toLocaleString()} outstanding` },
          { label: "Projects", value: summary.projects, icon: FolderKanban, sub: `$${summary.totalBudget.toLocaleString()} total budget` },
          { label: "Contacts", value: summary.contacts, icon: Users, sub: "All time" },
          { label: "Task Completion", value: `${summary.taskCompletion}%`, icon: CheckSquare, sub: `${summary.tasks} total tasks` },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4 text-brand-green" />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            <h3 className="text-sm font-semibold text-white">Revenue (Last 6 Months)</h3>
          </div>
          <div className="flex items-end gap-2 h-48">
            {months.map((m: ChartData, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">${m.value > 0 ? (m.value >= 1000 ? `${(m.value/1000).toFixed(1)}k` : m.value) : ""}</span>
                <div className="w-full bg-brand-navy-light rounded-t-md relative" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-brand-green to-brand-blue rounded-t-md transition-all duration-700"
                    style={{ height: `${maxRev > 0 ? (m.value / maxRev) * 100 : 0}%`, minHeight: m.value > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Growth */}
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-semibold text-white">Contact Growth (Last 6 Months)</h3>
          </div>
          <div className="h-48 relative">
            <svg viewBox="0 0 300 150" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1="0" y1={i * 37.5} x2="300" y2={i * 37.5} stroke="#1F2937" strokeWidth="0.5" />
              ))}
              {/* Area */}
              <path
                d={`M ${contactGrowth.map((p: ChartData, i: number) =>
                  `${(i / (contactGrowth.length - 1)) * 300},${150 - (p.value / maxContacts) * 140}`
                ).join(" L ")} L 300,150 L 0,150 Z`}
                fill="url(#areaGrad)" opacity="0.3"
              />
              {/* Line */}
              <path
                d={`M ${contactGrowth.map((p: ChartData, i: number) =>
                  `${(i / (contactGrowth.length - 1)) * 300},${150 - (p.value / maxContacts) * 140}`
                ).join(" L ")}`}
                fill="none" stroke="#00AEEF" strokeWidth="2"
              />
              {/* Dots */}
              {contactGrowth.map((p: ChartData, i: number) => (
                <circle key={i}
                  cx={(i / (contactGrowth.length - 1)) * 300}
                  cy={150 - (p.value / maxContacts) * 140}
                  r="4" fill="#00AEEF" stroke="#111827" strokeWidth="2"
                />
              ))}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00AEEF" />
                  <stop offset="100%" stopColor="#00AEEF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between mt-1">
              {contactGrowth.map((p: ChartData, i: number) => (
                <span key={i} className="text-[10px] text-gray-500">{p.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Project Status */}
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="w-4 h-4 text-brand-green" />
            <h3 className="text-sm font-semibold text-white">Projects by Status</h3>
          </div>
          {projectStatus.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projectStatus.map((s: any) => {
                const total = projectStatus.reduce((sum: number, x: any) => sum + x.value, 0);
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-medium">{s.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-brand-navy-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice Status */}
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-semibold text-white">Invoices by Status</h3>
          </div>
          {invoiceStatus.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoiceStatus.map((s: any) => {
                const total = invoiceStatus.reduce((sum: number, x: any) => sum + x.value, 0);
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-medium">{s.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-brand-navy-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Completion */}
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-brand-green" />
            <h3 className="text-sm font-semibold text-white">Tasks</h3>
          </div>
          {taskStatus.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {taskStatus.map((s: any) => {
                const total = taskStatus.reduce((sum: number, x: any) => sum + x.value, 0);
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-medium">{s.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-brand-navy-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Companies */}
      {topCompanies.length > 0 && (
        <div className="bg-surface border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand-green" />
            <h3 className="text-sm font-semibold text-white">Top Companies by Contacts</h3>
          </div>
          <div className="space-y-2">
            {topCompanies.map((c: ChartData, i: number) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{c.label}</span>
                    <span className="text-gray-400">{c.value} contacts</span>
                  </div>
                  <div className="h-1.5 bg-brand-navy-light rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green rounded-full" style={{ width: `${(c.value / topCompanies[0].value) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
