"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FolderKanban, Receipt, CheckSquare, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/${token}`);
        const json = await res.json();
        if (json.error) { setError(json.error); }
        else { setData(json); }
      } catch { setError("Failed to load portal"); }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#7AB929] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Portal Access Denied</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  const { contact, projects, invoices, tasks } = data;
  const totalOwed = invoices.filter((i: any) => ["sent", "overdue"].includes(i.status)).reduce((s: number, i: any) => s + parseFloat(i.total), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + parseFloat(i.total), 0);

  const tabs = [
    { key: "projects", label: "Projects", icon: FolderKanban, count: projects.length },
    { key: "invoices", label: "Invoices", icon: Receipt, count: invoices.length },
    { key: "tasks", label: "Tasks", icon: CheckSquare, count: tasks.length },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#111827]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#7AB929] to-[#00AEEF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <span className="font-bold text-sm text-white">
                <span style={{ color: "#7AB929" }}>Fit</span><span style={{ color: "#00AEEF" }}>Stack</span>
              </span>
              <span className="block text-[9px] text-gray-500">Client Portal</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">{contact.full_name}</p>
            <p className="text-xs text-gray-500">{contact.company || contact.email}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">Active Projects</p>
            <p className="text-xl font-bold text-white mt-1">{projects.filter((p: any) => p.status === "active").length}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">Open Tasks</p>
            <p className="text-xl font-bold text-white mt-1">{tasks.filter((t: any) => t.status !== "done").length}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-xl font-bold text-[#7AB929] mt-1">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className={cn("text-xl font-bold mt-1", totalOwed > 0 ? "text-red-400" : "text-gray-500")}>
              ${totalOwed.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-[#111827] border border-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
                activeTab === tab.key ? "bg-[#7AB929]/15 text-[#7AB929]" : "text-gray-500 hover:text-white")}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "projects" && (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center text-gray-500">No projects</div>
            ) : projects.map((p: any) => (
              <div key={p.id} className="bg-[#111827] border border-white/5 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border badge-${p.status}`}>
                    {p.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                {p.description && <p className="text-xs text-gray-500 mb-3">{p.description}</p>}
                <div className="flex gap-4 text-xs text-gray-500">
                  {p.budget && <span>Budget: ${parseFloat(p.budget).toLocaleString()}</span>}
                  {p.due_date && <span>Due: {new Date(p.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No invoices</div>
            ) : (
              <div className="divide-y divide-white/5">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      inv.status === "paid" ? "bg-green-500/10" : inv.status === "overdue" ? "bg-red-500/10" : "bg-blue-500/10")}>
                      {inv.status === "overdue" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Receipt className="w-4 h-4 text-[#00AEEF]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{inv.invoice_number}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border badge-${inv.status}`}>{inv.status.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Issued: {new Date(inv.issue_date).toLocaleDateString()} {inv.due_date && `· Due: ${new Date(inv.due_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">${parseFloat(inv.total).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center text-gray-500">No tasks</div>
            ) : tasks.map((t: any) => (
              <div key={t.id} className="bg-[#111827] border border-white/5 rounded-xl px-5 py-3 flex items-center gap-4">
                <CheckSquare className={cn("w-4 h-4 flex-shrink-0",
                  t.status === "done" ? "text-[#7AB929]" : t.status === "in_progress" ? "text-yellow-400" : "text-gray-600")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", t.status === "done" ? "text-gray-500 line-through" : "text-white")}>{t.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    {t.projects?.name && <span className="text-[10px] text-[#00AEEF]">{t.projects.name}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded badge-${t.priority}`}>{t.priority}</span>
                  </div>
                </div>
                {t.due_date && <span className="text-[10px] text-gray-600">{new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pt-8 border-t border-white/5">
          <p>Powered by <span style={{ color: "#7AB929" }}>Fit</span><span style={{ color: "#00AEEF" }}>Stack</span> · Ideatech · ideatech.org</p>
        </div>
      </div>
    </div>
  );
}
