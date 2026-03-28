import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface AIQueryParams {
  question: string;
  context: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

export async function queryAI({ question, context, conversationHistory = [] }: AIQueryParams) {
  const systemPrompt = `You are an AI assistant embedded in a FitStack business operations system.
You have access to the following data context about this organization:

${context}

RULES:
- Answer questions about the business data accurately and concisely.
- When asked about contacts, projects, or business metrics, reference the data context.
- If you don't have enough data to answer, say so clearly.
- Format responses with clear structure: use bullet points for lists, bold for key numbers.
- Always be helpful, direct, and actionable.
- If asked to generate a report or summary, structure it with headers and data points.
- Never make up data. Only reference what's in the context.`;

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
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

export function buildDataContext(contacts: any[], stats: any) {
  return `ORGANIZATION DATA SUMMARY:
- Total contacts: ${stats.totalContacts}
- Contacts added this month: ${stats.contactsThisMonth}
- Contacts with email: ${stats.withEmail}
- Contacts with phone: ${stats.withPhone}
- Most recent contact added: ${stats.mostRecent}

CONTACT LIST (sample of recent ${Math.min(contacts.length, 20)}):
${contacts.slice(0, 20).map(c =>
  `- ${c.full_name} | ${c.email || 'no email'} | ${c.company || 'no company'} | Added: ${c.created_at}`
).join("\n")}

You can reference this data when answering questions.`;
}
