/**
 * WhatsApp Business API Client
 *
 * This is a wrapper for the WhatsApp Business API (via 360dialog or Twilio).
 * Currently configured as a skeleton — fill in your API credentials to activate.
 *
 * SETUP:
 * 1. Sign up with 360dialog (https://www.360dialog.com) or Twilio
 * 2. Get your API token and Phone Number ID
 * 3. Add to .env.local:
 *    WHATSAPP_API_TOKEN=your-token
 *    WHATSAPP_PHONE_ID=your-phone-number-id
 *    WHATSAPP_API_URL=https://waba.360dialog.io/v1  (or Twilio URL)
 */

const WA_API_URL = process.env.WHATSAPP_API_URL || "https://waba.360dialog.io/v1";
const WA_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";

interface SendMessageParams {
  to: string;           // Phone number in E.164 format (+923001234567)
  message: string;      // Message text
  type?: "text" | "template";
  templateName?: string;
  templateParams?: string[];
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  if (!WA_TOKEN) {
    console.log("[WhatsApp] API not configured. Message would be sent to:", params.to, "Content:", params.message);
    return { success: true, messageId: `demo-${Date.now()}` };
  }

  try {
    const body = params.type === "template"
      ? {
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: "en" },
            components: params.templateParams
              ? [{ type: "body", parameters: params.templateParams.map(p => ({ type: "text", text: p })) }]
              : [],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: params.to,
          type: "text",
          text: { body: params.message },
        };

    const response = await fetch(`${WA_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to send message" };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  params: string[]
): Promise<SendMessageResult> {
  return sendWhatsAppMessage({
    to,
    message: "",
    type: "template",
    templateName,
    templateParams: params,
  });
}

/**
 * Template registry — map template names to descriptions.
 * Register your WhatsApp-approved templates here.
 */
export const WA_TEMPLATES = {
  CALCULATOR_RESPONSE: {
    name: "fitstack_calculator_response",
    description: "Sent after SaaS Waste Calculator submission",
    params: ["first_name", "monthly_waste", "annual_waste"],
  },
  DISCOVERY_CONFIRMATION: {
    name: "fitstack_discovery_confirmation",
    description: "Sent when discovery call is booked",
    params: ["first_name", "date", "time", "meeting_link"],
  },
  WELCOME_CLIENT: {
    name: "fitstack_welcome_client",
    description: "Sent when client signs up",
    params: ["first_name", "intake_form_link"],
  },
} as const;
