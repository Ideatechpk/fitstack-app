import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface AIQueryParams {
  question: string;
  context: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export async function queryAI({ question, context, conversationHistory = [] }: AIQueryParams) {
  const systemPrompt = `You are an AI business assistant embedded in a FitStack operations system built by Ideatech.
You have access to real data about this organization across all modules: contacts, projects, invoices, and WhatsApp messages.

${context}

RULES:
- Answer questions accurately based on the data context provided.
- For financial questions, always show exact numbers and calculations.
- Format responses with clear structure. Use **bold** for key numbers and findings.
- When asked for summaries, include the most actionable insights first.
- If asked about WhatsApp, reference the message history.
- If asked about revenue or money, cross-reference invoices and projects.
- If asked about client health, look at recent activity, invoice status, and communication recency.
- Never make up data. If data is insufficient, say so and suggest what data would help.
- Be direct and actionable. Business owners want answers, not essays.
- You can suggest next actions based on the data patterns you see.`;

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const text = response.content
    .filter(block => block.type === "text")
    .map(block => block.type === "text" ? block.text : "")
    .join("\n");

  return {
    answer: text,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

export function buildDataContext(data: {
  contacts: any[];
  projects: any[];
  invoices: any[];
  whatsappMessages: any[];
  stats: any;
}) {
  const { contacts, projects, invoices, whatsappMessages, stats } = data;

  return `═══ ORGANIZATION DATA CONTEXT ═══

CONTACTS (${stats.totalContacts} total):
- Added this month: ${stats.contactsThisMonth}
- With email: ${stats.withEmail} | With phone: ${stats.withPhone}
${contacts.slice(0, 25).map(c =>
  `  • ${c.full_name} | ${c.email || "no email"} | ${c.phone || "no phone"} | ${c.company || "no company"} | Tags: ${c.tags?.join(", ") || "none"} | Added: ${new Date(c.created_at).toLocaleDateString()}`
).join("\n")}

PROJECTS (${stats.totalProjects} total):
- Active: ${stats.activeProjects} | Completed: ${stats.completedProjects}
- Total budget: $${stats.totalBudget?.toLocaleString() || "0"}
${projects.slice(0, 20).map(p =>
  `  • "${p.name}" | Status: ${p.status} | Priority: ${p.priority} | Budget: $${p.budget || "0"} | Client: ${p.contacts?.full_name || "none"} | Due: ${p.due_date || "no date"}`
).join("\n")}

INVOICES (${stats.totalInvoices} total):
- Revenue received: $${stats.totalRevenue?.toLocaleString() || "0"}
- Outstanding: $${stats.totalOutstanding?.toLocaleString() || "0"}
- Overdue: ${stats.overdueInvoices}
${invoices.slice(0, 20).map(i =>
  `  • ${i.invoice_number} | Status: ${i.status} | Total: $${i.total} | Client: ${i.contacts?.full_name || "none"} | Due: ${i.due_date || "no date"} | Issued: ${i.issue_date}`
).join("\n")}

WHATSAPP MESSAGES (${stats.totalMessages} total, last 7 days: ${stats.recentMessages}):
${whatsappMessages.slice(0, 15).map(m =>
  `  • [${m.direction}] ${m.contacts?.full_name || "Unknown"}: "${m.content.slice(0, 80)}${m.content.length > 80 ? "..." : ""}" (${new Date(m.created_at).toLocaleDateString()})`
).join("\n")}

═══ END DATA CONTEXT ═══`;
}
