"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Loader2, Printer, ShieldAlert } from "lucide-react";

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated. Please log in first."); setLoading(false); return; }

      const { data, error: fetchErr } = await supabase.from("invoices")
        .select("*, contacts(full_name, email, phone, company)")
        .eq("id", invoiceId).eq("user_id", user.id).single();

      if (fetchErr || !data) { setError("Invoice not found"); setLoading(false); return; }
      setInvoice(data);
      setLoading(false);
    }
    load();
  }, [invoiceId, supabase]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <Loader2 style={{ width: 32, height: 32, color: "#7AB929", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", flexDirection: "column", gap: 12 }}>
      <ShieldAlert style={{ width: 48, height: 48, color: "#ef4444" }} />
      <p style={{ color: "#333", fontSize: 16 }}>{error}</p>
      <a href="/invoices" style={{ color: "#7AB929", fontSize: 14 }}>← Back to Invoices</a>
    </div>
  );

  const items = (invoice.items as any[]) || [];
  const contact = invoice.contacts;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: white; }
        .page { padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .brand h1 { font-size: 28px; font-weight: 700; }
        .green { color: #7AB929; }
        .blue { color: #00AEEF; }
        .brand p { color: #888; font-size: 12px; margin-top: 4px; }
        .inv-number { text-align: right; }
        .inv-number h2 { font-size: 20px; color: #1a1a2e; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-sent { background: #dbeafe; color: #2563eb; }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-overdue { background: #fef2f2; color: #ef4444; }
        .status-cancelled { background: #f3f4f6; color: #9ca3af; }
        .details { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .detail-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; }
        .detail-block p { font-size: 13px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 2px solid #e5e7eb; }
        th:last-child, td:last-child { text-align: right; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals-row.total { border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 6px; font-weight: 700; font-size: 16px; }
        .total-amount { color: #7AB929; }
        .notes { margin-top: 32px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666; }
        .notes h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
        .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #f3f4f6; padding-top: 16px; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; background: #7AB929; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(122,185,41,0.3); display: flex; align-items: center; gap: 8px; }
        .print-btn:hover { background: #5A9A10; }
        @media print { .print-btn { display: none !important; } .page { padding: 20px; } }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="brand">
            <h1><span className="green">Fit</span><span className="blue">Stack</span></h1>
            <p>by Ideatech · ideatech.org</p>
          </div>
          <div className="inv-number">
            <h2>{invoice.invoice_number}</h2>
            <span className={`status status-${invoice.status}`}>{invoice.status}</span>
          </div>
        </div>

        <div className="details">
          <div className="detail-block">
            <h3>Bill To</h3>
            <p><strong>{contact?.full_name || "—"}</strong></p>
            {contact?.company && <p>{contact.company}</p>}
            {contact?.email && <p>{contact.email}</p>}
            {contact?.phone && <p>{contact.phone}</p>}
          </div>
          <div className="detail-block" style={{ textAlign: "right" }}>
            <h3>Invoice Details</h3>
            <p>Issue Date: {new Date(invoice.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            {invoice.due_date && <p>Due Date: {new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
            <p>Currency: {invoice.currency}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: "50%" }}>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.description || "—"}</td>
                <td>{item.quantity || 1}</td>
                <td>${parseFloat(item.rate || 0).toFixed(2)}</td>
                <td>${parseFloat(item.amount || 0).toFixed(2)}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#999" }}>No line items</td></tr>
            )}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-table">
            <div className="totals-row"><span>Subtotal</span><span>${parseFloat(invoice.subtotal).toFixed(2)}</span></div>
            {parseFloat(invoice.tax_rate) > 0 && (
              <div className="totals-row"><span>Tax ({invoice.tax_rate}%)</span><span>${parseFloat(invoice.tax_amount).toFixed(2)}</span></div>
            )}
            <div className="totals-row total"><span>Total</span><span className="total-amount">${parseFloat(invoice.total).toFixed(2)}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className="footer">
          <p>FitStack by Ideatech · ideatech.org/fitstack · hello@ideatech.org</p>
          <p style={{ marginTop: 4 }}>Thank you for your business</p>
        </div>
      </div>

      <button className="print-btn" onClick={() => window.print()}>
        <Printer style={{ width: 18, height: 18 }} />
        Download PDF
      </button>
    </>
  );
}
