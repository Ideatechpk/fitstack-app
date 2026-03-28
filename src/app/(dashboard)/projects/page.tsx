"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, FolderKanban, X, Trash2, Edit, Calendar, DollarSign } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Project {
  id: string; name: string; description: string | null; status: string;
  priority: string; budget: string | null; spent: string | null;
  start_date: string | null; due_date: string | null; tags: string[] | null;
  contact_id: string | null; created_at: string;
  contacts?: { full_name: string } | null;
}

const STATUS_OPTS = ["active", "on_hold", "completed", "cancelled"];
const PRIORITY_OPTS = ["low", "medium", "high", "urgent"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", description: "", status: "active", priority: "medium",
    budget: "", start_date: "", due_date: "", tags: "", contact_id: "",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from("projects").select("*, contacts(full_name)")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (search) query = query.ilike("name", `%${search}%`);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data } = await query;
    setProjects(data || []);

    const { data: c } = await supabase.from("contacts").select("id, full_name")
      .eq("user_id", user.id).order("full_name");
    setContacts(c || []);
    setLoading(false);
  }, [search, filterStatus, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase.channel("projects-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchData]);

  function resetForm() {
    setForm({ name: "", description: "", status: "active", priority: "medium", budget: "", start_date: "", due_date: "", tags: "", contact_id: "" });
    setEditingId(null); setShowForm(false);
  }

  function startEdit(p: Project) {
    setForm({
      name: p.name, description: p.description || "", status: p.status, priority: p.priority,
      budget: p.budget || "", start_date: p.start_date || "", due_date: p.due_date || "",
      tags: p.tags?.join(", ") || "", contact_id: p.contact_id || "",
    });
    setEditingId(p.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      name: form.name, description: form.description || null,
      status: form.status, priority: form.priority,
      budget: form.budget ? parseFloat(form.budget) : null,
      start_date: form.start_date || null, due_date: form.due_date || null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      contact_id: form.contact_id || null, user_id: user.id,
    };
    if (editingId) await supabase.from("projects").update(payload).eq("id", editingId);
    else await supabase.from("projects").insert(payload);
    resetForm(); fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    fetchData();
  }

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    totalBudget: projects.reduce((sum, p) => sum + (parseFloat(p.budget || "0")), 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} projects · {stats.active} active · ${stats.totalBudget.toLocaleString()} total budget</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..." className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/30 transition" />
        </div>
        <div className="flex gap-1.5 bg-surface border border-white/5 rounded-xl p-1">
          {["all", ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-brand-green/15 text-brand-green" : "text-gray-500 hover:text-white")}>
              {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Project" : "New Project"}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Budget ($)</label>
                  <input type="number" step="0.01" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client (Contact)</label>
                  <select value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    <option value="">No client linked</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="web, design, urgent"
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white py-2.5 rounded-lg text-sm font-semibold transition">{editingId ? "Update" : "Create Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Cards */}
      {loading ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <FolderKanban className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No projects yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first project to start tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                  {project.contacts && (
                    <p className="text-xs text-gray-500 mt-0.5">Client: {project.contacts.full_name}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => startEdit(project)} className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/5"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(project.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {project.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border badge-${project.status}`}>
                  {project.status.replace("_", " ").toUpperCase()}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border badge-${project.priority}`}>
                  {project.priority.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {project.budget && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${parseFloat(project.budget).toLocaleString()}</span>
                )}
                {project.due_date && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
                <span className="ml-auto">{formatRelative(project.created_at)}</span>
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
