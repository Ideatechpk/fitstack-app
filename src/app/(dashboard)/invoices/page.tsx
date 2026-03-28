"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Receipt, X, Trash2, Edit, DollarSign, CheckCircle } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Invoice {
  id: string; invoice_number: string; status: string; issue_date: string;
  due_date: string | null; subtotal: string; tax_rate: string; tax_amount: string;
  total: string; currency: string; notes: string | null; items: any[];
  contact_id: string | null; project_id: string | null; paid_at: string | null;
  created_at: string;
  contacts?: { full_name: string } | null;
  projects?: { name: string } | null;
}

const STATUS_OPTS = ["draft", "sent", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    invoice_number: "", status: "draft", issue_date: new Date().toISOString().split("T")[0],
    due_date: "", subtotal: "", tax_rate: "0", currency: "USD", notes: "",
    contact_id: "", project_id: "",
    items: [{ description: "", quantity: "1", rate: "", amount: "" }] as any[],
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from("invoices").select("*, contacts(full_name), projects(name)")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (search) query = query.ilike("invoice_number", `%${search}%`);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    const { data } = await query;
    setInvoices(data || []);
    const { data: c } = await supabase.from("contacts").select("id, full_name").eq("user_id", user.id);
    setContacts(c || []);
    const { data: p } = await supabase.from("projects").select("id, name").eq("user_id", user.id);
    setProjectsList(p || []);
    setLoading(false);
  }, [search, filterStatus, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time
  useEffect(() => {
    const channel = supabase.channel("invoices-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchData]);

  function resetForm() {
    setForm({
      invoice_number: `INV-${String(invoices.length + 1).padStart(4, "0")}`,
      status: "draft", issue_date: new Date().toISOString().split("T")[0],
      due_date: "", subtotal: "", tax_rate: "0", currency: "USD", notes: "",
      contact_id: "", project_id: "",
      items: [{ description: "", quantity: "1", rate: "", amount: "" }],
    });
    setEditingId(null); setShowForm(false);
  }

  function updateItem(index: number, field: string, value: string) {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      const qty = parseFloat(updated[index].quantity) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      updated[index].amount = (qty * rate).toFixed(2);
    }
    const subtotal = updated.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm({ ...form, items: updated, subtotal: subtotal.toFixed(2) });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { description: "", quantity: "1", rate: "", amount: "" }] });
  }

  function removeItem(index: number) {
    if (form.items.length <= 1) return;
    const updated = form.items.filter((_, i) => i !== index);
    const subtotal = updated.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm({ ...form, items: updated, subtotal: subtotal.toFixed(2) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const subtotal = parseFloat(form.subtotal) || 0;
    const taxRate = parseFloat(form.tax_rate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const payload = {
      invoice_number: form.invoice_number, status: form.status,
      issue_date: form.issue_date, due_date: form.due_date || null,
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      currency: form.currency, notes: form.notes || null,
      items: form.items.filter(i => i.description),
      contact_id: form.contact_id || null, project_id: form.project_id || null,
      user_id: user.id,
    };
    if (editingId) await supabase.from("invoices").update(payload).eq("id", editingId);
    else await supabase.from("invoices").insert(payload);
    resetForm(); fetchData();
  }

  async function markPaid(id: string) {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    fetchData();
  }

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0);
  const totalOutstanding = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + parseFloat(i.total), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">
            ${totalRevenue.toLocaleString()} received · ${totalOutstanding.toLocaleString()} outstanding
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice number..." className="w-full bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/30 transition" />
        </div>
        <div className="flex gap-1.5 bg-surface border border-white/5 rounded-xl p-1">
          {["all", ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-brand-green/15 text-brand-green" : "text-gray-500 hover:text-white")}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Invoice # *</label>
                  <input type="text" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Issue Date *</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client</label>
                  <select value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    <option value="">No client</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Project</label>
                  <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}
                    className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition">
                    <option value="">No project</option>
                    {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Line Items */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Line Items</label>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 transition" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)}
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-brand-green/50 transition" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" step="0.01" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)}
                          className="w-full bg-brand-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-brand-green/50 transition" />
                      </div>
                      <div className="col-span-2 text-right text-sm text-gray-400 py-2">${item.amount || "0.00"}</div>
                      <div className="col-span-1">
                        <button type="button" onClick={() => removeItem(i)} className="p-2 text-gray-600 hover:text-red-400 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="text-xs text-brand-blue hover:text-brand-blue-light mt-2 transition">+ Add line item</button>
              </div>
              {/* Totals */}
              <div className="bg-brand-navy rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">${form.subtotal || "0.00"}</span></div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-gray-400">Tax (%)</span>
                  <input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: e.target.value})}
                    className="w-20 bg-brand-navy-light border border-white/10 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-brand-green/50 transition" />
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                  <span className="text-white">Total</span>
                  <span className="text-brand-green">${((parseFloat(form.subtotal) || 0) * (1 + (parseFloat(form.tax_rate) || 0) / 100)).toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                  className="w-full bg-brand-navy border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white py-2.5 rounded-lg text-sm font-semibold transition">{editingId ? "Update" : "Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {loading ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <Receipt className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No invoices yet</p>
        </div>
      ) : (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition group">
                <div className="w-10 h-10 bg-brand-navy-light rounded-lg flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-brand-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{inv.invoice_number}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border badge-${inv.status}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {inv.contacts?.full_name || "No client"} {inv.projects ? `· ${inv.projects.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${parseFloat(inv.total).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.issue_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {inv.status !== "paid" && (
                    <button onClick={() => markPaid(inv.id)} className="p-1.5 text-gray-600 hover:text-green-400 rounded-lg hover:bg-white/5" title="Mark Paid">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
