export async function sendWhatsAppMessage(
  to: string,
  template: string,
  params: Record<string, string>
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || 'MOCK_TOKEN';
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (token === 'MOCK_TOKEN' || !phoneId) {
    console.log(`[WhatsApp Mock] Sending message to ${to}`);
    console.log(`Template: ${template}`, params);
    return { success: true, mock: true };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: template,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: Object.entries(params).map(([_, text]) => ({
                type: "text",
                text
              }))
            }
          ]
        }
      })
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return { success: false, error };
  }
}
