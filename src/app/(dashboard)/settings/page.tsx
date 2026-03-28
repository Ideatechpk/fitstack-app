"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, User } from "lucide-react";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) setFullName(profile.full_name);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-white/5 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-white/5">
          <div className="w-14 h-14 bg-brand-navy-light rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-brand-coral" />
          </div>
          <div>
            <p className="text-white font-medium">{fullName || "Your Name"}</p>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-brand-navy border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-coral/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            type="email" value={email} disabled
            className="w-full bg-brand-navy border border-white/10 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-600 mt-1">Email cannot be changed from here</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-coral hover:bg-brand-coral/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && <span className="text-sm text-green-400">Saved successfully</span>}
        </div>
      </form>

      <div className="bg-surface border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-2">System Information</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">Platform: <span className="text-gray-300">FitStack v1.0</span></p>
          <p className="text-gray-500">Stack: <span className="text-gray-300">Next.js + Supabase + Claude AI</span></p>
          <p className="text-gray-500">Built by: <span className="text-brand-coral">Ideatech</span></p>
        </div>
      </div>
    </div>
  );
}
