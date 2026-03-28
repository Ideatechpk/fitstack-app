"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, CheckSquare, X, Trash2, Circle, CheckCircle2, Clock, AlertCircle, Calendar, UserCircle } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Task {
  id: string; title: string; description: string | null; status: string;
  priority: string; due_date: string | null; project_id: string | null;
  contact_id: string | null; assigned_to: string | null; completed_at: string | null; created_at: string;
  projects?: { name: string } | null;
  contacts?: { full_name: string } | null;
  assignee?: { full_name: string } | null;
}

interface TeamMember { id: string; full_name: string; }

const STATUS_ICONS: Record<string, any> = {
  todo: Circle, in_progress: Clock, done: CheckCircle2, cancelled: AlertCircle,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", status: "todo", priority: "medium",
    due_date: "", project_id: "", contact_id: "", assigned_to: "",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from("tasks").select("*, projects(name), contacts(full_name)")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    const { data } = await query;

    // Fetch team members (all profiles)
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    setTeamMembers(profiles || []);

    // Attach assignee names to tasks
    const tasksWithAssignee = (data || []).map(task => ({
      ...task,
      assignee: task.assigned_to ? (profiles || []).find(p => p.id === task.assigned_to) || null : null,
    }));

    setTasks(tasksWithAssignee);
    const { data: p } = await supabase.from("projects").select("id, name").eq("user_id", user.id);
    setProjects(p || []);
    const { data: c } = await supabase.from("contacts").select("id, full_name").eq("user_id", user.id);
    setContacts(c || []);
    setLoading(false);
  }, [filterStatus, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time
  useEffect(() => {
    const ch = supabase.channel("tasks-rt").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, fetchData]);

  function resetForm() {
    setForm({ title: "", description: "", status: "todo", priority: "medium", due_date: "", project_id: "", contact_id: "", assigned_to: "" });
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("tasks").insert({
      title: form.title, description: form.description || null,
      status: form.status, priority: form.priority,
      due_date: form.due_date || null,
      project_id: form.project_id || null, contact_id: form.contact_id || null,
      assigned_to: form.assigned_to || null,
      user_id: user.id,
    });
    resetForm(); fetchData();
  }

  async function toggleStatus(task: Task) {
    const next = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
    await supabase.from("tasks").update({
      status: next,
      completed_at: next === "done" ? new Date().toISOString() : null,
    }).eq("id", task.id);
    fetchData();
  }

  async function handleAssign(taskId: string, assigneeId: string) {
    await supabase.from("tasks").update({ assigned_to: assigneeId || null }).eq("id", taskId);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    fetchData();
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  const isOverdue = (t: Task) => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.todo} to do · {stats.inProgress} in progress · {stats.done} done
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 bg-surface border border-white/5 rounded-xl p-1 w-fit">
        {[
          { key: "all", label: "All" },
          { key: "todo", label: "To Do" },
          { key: "in_progress", label: "In Progress" },
          { key: "done", label: "Done" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
              filterStatus === f.key ? "bg-brand-green/15 text-brand-green" : "text-gray-500 hover:text-white")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">New Task</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    {["low","medium","high","urgent"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Project</label>
                  <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Assign To</label>
                  <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white py-2.5 rounded-lg text-sm font-semibold transition">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <CheckSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const Icon = STATUS_ICONS[task.status] || Circle;
            const overdue = isOverdue(task);
            return (
              <div key={task.id} className={cn("bg-surface border rounded-xl px-5 py-3 flex items-center gap-4 group transition",
                overdue ? "border-red-500/20" : "border-white/5 hover:border-white/10")}>
                {/* Status toggle */}
                <button onClick={() => toggleStatus(task)} className="flex-shrink-0">
                  <Icon className={cn("w-5 h-5 transition",
                    task.status === "done" ? "text-brand-green" :
                    task.status === "in_progress" ? "text-yellow-400" :
                    "text-gray-600 hover:text-brand-green")} />
                </button>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", task.status === "done" ? "text-gray-500 line-through" : "text-white")}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.projects && <span className="text-[10px] text-brand-blue">{task.projects.name}</span>}
                    {task.due_date && (
                      <span className={cn("text-[10px] flex items-center gap-0.5", overdue ? "text-red-400" : "text-gray-500")}>
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {overdue && " (overdue)"}
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded badge-${task.priority}`}>{task.priority}</span>
                  </div>
                </div>

                {/* Assignee badge + dropdown */}
                <div className="flex items-center gap-2">
                  {task.assignee ? (
                    <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full flex items-center gap-1">
                      <UserCircle className="w-3 h-3" />
                      {task.assignee.full_name}
                    </span>
                  ) : null}

                  {/* Inline assign dropdown (visible on hover) */}
                  <select
                    value={task.assigned_to || ""}
                    onChange={e => handleAssign(task.id, e.target.value)}
                    title="Assign to team member"
                    className="opacity-0 group-hover:opacity-100 bg-brand-navy border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-brand-green/50 transition w-28 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>

                <span className="text-[10px] text-gray-600 hidden sm:block">{formatRelative(task.created_at)}</span>

                <button onClick={() => handleDelete(task.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
