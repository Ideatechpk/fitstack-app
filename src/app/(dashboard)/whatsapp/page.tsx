"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, MessageCircle, Phone, Search } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

interface Message { id: string; direction: string; content: string; status: string; created_at: string; contact_id: string | null; }
interface Contact { id: string; full_name: string; phone: string | null; }

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchContacts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let q = supabase.from("contacts").select("id, full_name, phone").eq("user_id", user.id).not("phone", "is", null).order("full_name");
    if (search) q = q.ilike("full_name", `%${search}%`);
    const { data } = await q;
    setContacts(data || []);
  }, [search, supabase]);

  const fetchMessages = useCallback(async () => {
    if (!selectedContact) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("whatsapp_messages").select("*")
      .eq("user_id", user.id).eq("contact_id", selectedContact.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, [selectedContact, supabase]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Real-time messages
  useEffect(() => {
    const channel = supabase.channel("wa-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_messages" }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || sending) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Log outbound message (in production, this would call WhatsApp API first)
    await supabase.from("whatsapp_messages").insert({
      user_id: user.id, contact_id: selectedContact.id,
      direction: "outbound", message_type: "text",
      content: newMessage.trim(), status: "sent",
    });

    setNewMessage("");
    setSending(false);
    fetchMessages();
  }

  // Simulate inbound message (for demo purposes)
  async function simulateInbound() {
    if (!selectedContact) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const replies = ["Thanks for the update!", "Got it, will review.", "When can we schedule a call?", "Sounds good, let's proceed.", "Can you send the invoice?"];
    await supabase.from("whatsapp_messages").insert({
      user_id: user.id, contact_id: selectedContact.id,
      direction: "inbound", message_type: "text",
      content: replies[Math.floor(Math.random() * replies.length)], status: "delivered",
    });
    fetchMessages();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-1">Message your contacts via WhatsApp Business API</p>
      </div>

      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)" }}>
        {/* Contact List */}
        <div className="w-72 border-r border-white/5 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
                className="w-full bg-brand-navy border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/30 transition" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-6 text-center">
                <Phone className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No contacts with phone numbers</p>
              </div>
            ) : contacts.map(c => (
              <button key={c.id} onClick={() => setSelectedContact(c)}
                className={cn("w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition",
                  selectedContact?.id === c.id && "bg-brand-green/5 border-l-2 border-l-brand-green")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-navy-light rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-green">{c.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.phone}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Select a contact to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedContact.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedContact.phone}</p>
                  </div>
                </div>
                <button onClick={simulateInbound}
                  className="text-xs text-brand-blue hover:text-brand-blue-light border border-brand-blue/20 px-3 py-1 rounded-lg transition">
                  Simulate Reply
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-sm">No messages yet. Send the first one!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-xl px-4 py-2.5 text-sm",
                      msg.direction === "outbound" ? "bg-green-600/20 text-green-100" : "bg-brand-navy-light text-gray-300")}>
                      <p>{msg.content}</p>
                      <p className={cn("text-[10px] mt-1", msg.direction === "outbound" ? "text-green-500/60" : "text-gray-600")}>
                        {formatRelative(msg.created_at)} {msg.direction === "outbound" && `· ${msg.status}`}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/5">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..." disabled={sending}
                    className="flex-1 bg-brand-navy border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/30 transition" />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-lg transition disabled:opacity-30">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
