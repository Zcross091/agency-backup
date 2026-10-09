const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1546899444933333244/b7Yd7ViuySu23i9e_pITC01e24Wl6OyiPZKNqo4TTYDaSJ8fkGiUkKbFCtc2eLAa0Wh9";
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbzhJQw61YLOYHF2nhqavqA4xMyW9ZinlqhTOX7_njxfuOhJ4z0_cgFjGWTf1yWW-IvEyA/exec";

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let data = req.body;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (_) {}
    }
    data = data || {};

    const name = (data.name || "").trim();
    const contact = (data.contact || data.phone || "").trim();
    const email = (data.email || "").trim();
    const business = (data.business || "").trim();
    const country = (data.country || "India").trim();
    const needs = (data.needs || "").trim();

    const cleanDigits = contact.replace(/[^0-9+]/g, "");

    // 1. Dispatch to Google Sheets & Apps Script Pipeline
    // (Google Apps Script automatically appends row to Sheet, sends Email alert, and dispatches embed to Discord)
    let sheetSucceeded = false;
    if (GOOGLE_SHEET_WEBHOOK_URL) {
      try {
        const sheetRes = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (sheetRes.ok) {
          sheetSucceeded = true;
        }
      } catch (err) {
        console.warn("Google Sheet webhook note:", err);
      }
    }

    // 2. Direct Discord Fallback: Only send directly if Google Sheet webhook failed or is not configured
    // This prevents duplicate messages in Discord (#support-needed)
    if (!sheetSucceeded && DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        username: "Northex Executive Desk",
        avatar_url: "https://raw.githubusercontent.com/Zcross091/agency-backup/main/favicon.png",
        embeds: [
          {
            title: "🌟 NEW INCOMING CLIENT INQUIRY",
            description: "A high-intent prospect has submitted their strategic consultation request via the agency website.",
            color: 0xFFD3AC,
            fields: [
              { name: "👤 Client Name", value: `**${name || "Valued Client"}**`, inline: true },
              { name: "💼 Business / Brand", value: `**${business || "N/A"}**`, inline: true },
              { name: "🌍 Country", value: `\`${country}\``, inline: true },
              { name: "📞 Phone / WhatsApp", value: contact ? `[\`${contact}\`](tel:${cleanDigits})` : "*Not provided*", inline: true },
              { name: "✉️ Email Address", value: email ? `[${email}](mailto:${email})` : "*Not provided*", inline: true },
              { name: "⏰ Submitted At", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
              { name: "🎯 Goals & Business Requirements", value: `\`\`\`fix\n${(needs || "None specified").slice(0, 1000)}\n\`\`\``, inline: false }
            ],
            footer: {
              text: "Northex Performance Marketing OS • Fallback Cloud Dispatch",
              icon_url: "https://raw.githubusercontent.com/Zcross091/agency-backup/main/favicon.png"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      }).catch(err => console.warn("Discord dispatch note:", err));
    }

    return res.status(200).json({ success: true, message: "Inquiry processed successfully." });
  } catch (err) {
    console.error("Vercel Serverless Function error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
