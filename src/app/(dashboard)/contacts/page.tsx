"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Users, X, Phone, Mail, Building, Trash2, Edit, Link, Check } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[] | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", tags: "", notes: "" });

  const supabase = createClient();

  const fetchContacts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data } = await query;
    setContacts(data || []);
    setLoading(false);
  }, [search, supabase]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  function resetForm() {
    setForm({ full_name: "", email: "", phone: "", company: "", tags: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(contact: Contact) {
    setForm({
      full_name: contact.full_name,
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      tags: contact.tags?.join(", ") || "",
      notes: contact.notes || "",
    });
    setEditingId(contact.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      notes: form.notes || null,
      user_id: user.id,
    };

    if (editingId) {
      await supabase.from("contacts").update(payload).eq("id", editingId);
    } else {
      await supabase.from("contacts").insert(payload);
    }

    resetForm();
    fetchContacts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    fetchContacts();
  }

  async function copyPortalLink(contactId: string) {
    setPortalError(null);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId }),
      });
      const data = await res.json();
      if (data.error) {
        setPortalError(contactId);
        setTimeout(() => setPortalError(null), 2000);
        return;
      }
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setCopiedId(contactId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      setPortalError(contactId);
      setTimeout(() => setPortalError(null), 2000);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts by name, email, or company..."
          className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/30 transition"
        />
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Contact" : "Add New Contact"}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Company</label>
                  <input type="text" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})}
                    placeholder="client, vip, lead"
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white py-2.5 rounded-lg text-sm font-semibold transition">
                  {editingId ? "Update Contact" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact List */}
      {loading ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No contacts yet</p>
          <p className="text-gray-600 text-sm mt-1">Add your first contact to get started</p>
        </div>
      ) : (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition group">
                {/* Avatar */}
                <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-green">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{contact.full_name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {contact.company && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Building className="w-3 h-3" /> {contact.company}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" /> {contact.phone}
                      </span>
                    )}
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {contact.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time + Actions */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 hidden sm:block mr-2">{formatRelative(contact.created_at)}</span>

                  {/* Portal Link button */}
                  <button
                    onClick={() => copyPortalLink(contact.id)}
                    title="Copy client portal link"
                    className="p-1.5 text-gray-600 hover:text-brand-green rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition"
                  >
                    {copiedId === contact.id ? (
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                    ) : portalError === contact.id ? (
                      <X className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Link className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Edit button */}
                  <button onClick={() => startEdit(contact)}
                    title="Edit contact"
                    className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition">
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button onClick={() => handleDelete(contact.id)}
                    title="Delete contact"
                    className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copied notification toast */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 bg-brand-green text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in z-50">
          <Check className="w-4 h-4" />
          Portal link copied to clipboard
        </div>
      )}
    </div>
  );
}
