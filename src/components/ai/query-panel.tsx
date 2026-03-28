"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string; }

export function AIQueryPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationHistory: messages.slice(-6) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.error ? `Error: ${data.error}` : data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  }

  const suggestions = [
    "Give me a full business summary",
    "Which invoices are overdue?",
    "Show active projects and their budgets",
    "Contacts I haven't messaged on WhatsApp recently",
    "What's my total revenue this month?",
    "Which clients have the most projects?",
  ];

  return (
    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-green" />
          <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
          <span className="text-[10px] bg-gradient-to-r from-brand-green/15 to-brand-blue/15 text-brand-green px-2 py-0.5 rounded-full font-medium">
            Claude AI
          </span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-white transition">
          {isOpen ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </button>
      </div>
      {isOpen && (
        <>
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-brand-green/30 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Ask anything about your contacts, projects, invoices, or messages</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left text-xs bg-brand-navy-light border border-white/5 rounded-lg px-3 py-2 text-gray-400 hover:text-white hover:border-brand-green/30 transition">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-brand-green to-brand-blue text-white"
                    : "bg-brand-navy-light text-gray-300 ai-response")}>
                  {msg.role === "assistant" ? (
                    <div dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n- /g, "\n<br/>• ")
                        .replace(/\n\n/g, "<br/><br/>")
                        .replace(/\n/g, "<br/>")
                    }} />
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-brand-navy-light rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-brand-green animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about contacts, projects, invoices, revenue..." disabled={loading}
                className="flex-1 bg-brand-navy-light border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 transition" />
              <button type="submit" disabled={loading || !input.trim()}
                className="bg-brand-green hover:bg-brand-green-dark text-white p-2.5 rounded-lg transition disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
