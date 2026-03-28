import { AIQueryPanel } from "@/components/ai/query-panel";

export default function AIPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ask questions about your contacts and business data in plain language
        </p>
      </div>
      <AIQueryPanel />
      <div className="bg-surface border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">What you can ask</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            "How many contacts do I have?",
            "List contacts from company X",
            "Who was added this week?",
            "Contacts missing phone numbers",
            "Give me a contact database summary",
            "Which companies appear most?",
            "Contacts with the tag 'vip'",
            "Draft a follow-up plan for new leads",
          ].map((q) => (
            <p key={q} className="text-xs text-gray-500 bg-brand-navy-light rounded-lg px-3 py-2">
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
