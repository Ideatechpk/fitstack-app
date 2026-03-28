"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Edit, X, CheckSquare, Clock, Circle, Save, Copy, Check, UserPlus } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface TeamMember {
  id: string; full_name: string; email: string; role: string;
  job_title: string | null; department: string | null; phone: string | null;
  is_active: boolean; created_at: string; avatar_url: string | null;
  taskStats?: { total: number; done: number; inProgress: number; todo: number; };
}

const ROLES = ["admin", "manager", "member", "viewer"];
const DEPARTMENTS = ["Operations", "Development", "Design", "Sales", "Marketing", "Finance", "Support"];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "", job_title: "", department: "", phone: "" });
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeam = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Fetch all team profiles
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

    // Fetch all tasks to calculate stats per person
    const { data: allTasks } = await supabase.from("tasks").select("assigned_to, status");

    const membersWithStats = (profiles || []).map(p => {
      const myTasks = (allTasks || []).filter(t => t.assigned_to === p.id);
      return {
        ...p,
        is_active: p.is_active !== false,
        taskStats: {
          total: myTasks.length,
          done: myTasks.filter(t => t.status === "done").length,
          inProgress: myTasks.filter(t => t.status === "in_progress").length,
          todo: myTasks.filter(t => t.status === "todo").length,
        },
      };
    });

    setMembers(membersWithStats);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  function startEdit(member: TeamMember) {
    setEditForm({
      role: member.role, job_title: member.job_title || "",
      department: member.department || "", phone: member.phone || "",
    });
    setEditingId(member.id);
  }

  async function saveEdit() {
    if (!editingId) return;
    await supabase.from("profiles").update({
      role: editForm.role, job_title: editForm.job_title || null,
      department: editForm.department || null, phone: editForm.phone || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editingId);
    setEditingId(null);
    fetchTeam();
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    await supabase.from("profiles").update({ is_active: !currentlyActive, updated_at: new Date().toISOString() }).eq("id", id);
    fetchTeam();
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/register`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeCount = members.filter(m => m.is_active).length;
  const totalTasksDone = members.reduce((s, m) => s + (m.taskStats?.done || 0), 0);
  const totalTasks = members.reduce((s, m) => s + (m.taskStats?.total || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} active members · {totalTasksDone}/{totalTasks} tasks completed
          </p>
        </div>
        <button onClick={copyInviteLink}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          {copied ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {copied ? "Invite Link Copied!" : "Copy Invite Link"}
        </button>
      </div>

      {/* How to add team members */}
      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4">
        <p className="text-sm text-brand-blue font-medium mb-1">How to add team members</p>
        <p className="text-xs text-gray-400">
          Click &ldquo;Copy Invite Link&rdquo; above and send it to your team member. They register at that link with their email and password.
          Once registered, they appear here automatically. Then you update their role, job title, and department below.
        </p>
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No team members yet</p>
          <p className="text-gray-600 text-sm mt-1">Share the invite link to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const isEditing = editingId === member.id;
            const isCurrentUser = member.id === currentUserId;
            const completionPct = member.taskStats && member.taskStats.total > 0
              ? Math.round((member.taskStats.done / member.taskStats.total) * 100) : 0;

            return (
              <div key={member.id} className={cn(
                "bg-surface border rounded-xl overflow-hidden transition",
                !member.is_active ? "border-white/5 opacity-60" : "border-white/5 hover:border-white/10"
              )}>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm",
                    member.is_active
                      ? "bg-gradient-to-br from-brand-green/20 to-brand-blue/20 text-brand-green"
                      : "bg-gray-800 text-gray-600"
                  )}>
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{member.full_name}</p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">You</span>
                      )}
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        member.role === "admin" ? "border-brand-green/30 text-brand-green bg-brand-green/5" :
                        member.role === "manager" ? "border-brand-blue/30 text-brand-blue bg-brand-blue/5" :
                        "border-gray-600 text-gray-400 bg-gray-800")}>
                        {member.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span>{member.email}</span>
                      {member.job_title && <span>· {member.job_title}</span>}
                      {member.department && <span>· {member.department}</span>}
                    </div>
                  </div>

                  {/* Task Stats */}
                  {member.taskStats && member.taskStats.total > 0 && (
                    <div className="hidden sm:flex items-center gap-3 mr-4">
                      <div className="flex items-center gap-1 text-xs" title="To Do">
                        <Circle className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">{member.taskStats.todo}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" title="In Progress">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-400">{member.taskStats.inProgress}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" title="Done">
                        <CheckSquare className="w-3 h-3 text-brand-green" />
                        <span className="text-brand-green">{member.taskStats.done}</span>
                      </div>
                      <div className="w-16 h-1.5 bg-brand-navy-light rounded-full overflow-hidden" title={`${completionPct}% complete`}>
                        <div className="h-full bg-brand-green rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => isEditing ? setEditingId(null) : startEdit(member)}
                      title="Edit member" className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 transition">
                      {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    </button>
                    {!isCurrentUser && (
                      <button onClick={() => toggleActive(member.id, member.is_active)}
                        title={member.is_active ? "Deactivate" : "Reactivate"}
                        className={cn("text-xs px-2 py-1 rounded-lg border transition",
                          member.is_active
                            ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                            : "border-brand-green/20 text-brand-green hover:bg-brand-green/10")}>
                        {member.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Panel (inline expand) */}
                {isEditing && (
                  <div className="border-t border-white/5 px-5 py-4 bg-brand-navy/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Role</label>
                        <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Job Title</label>
                        <input type="text" value={editForm.job_title} onChange={e => setEditForm({...editForm, job_title: e.target.value})}
                          placeholder="e.g. Operations Analyst"
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Department</label>
                        <select value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})}
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                          <option value="">None</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Phone</label>
                        <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          placeholder="+92 300 1234567"
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 transition" />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button onClick={saveEdit}
                        className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-surface border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex gap-2">
            <span className="text-brand-green font-semibold w-16">Admin</span>
            <span className="text-gray-400">Full access. Can manage team, create/edit/delete all data, access settings.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-brand-blue font-semibold w-16">Manager</span>
            <span className="text-gray-400">Can create/edit data, assign tasks, view all contacts and projects.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 font-semibold w-16">Member</span>
            <span className="text-gray-400">Can view assigned data, complete tasks, log activities.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 font-semibold w-16">Viewer</span>
            <span className="text-gray-400">Read-only access. Can view data but cannot create or edit.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
