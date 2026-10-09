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
    const address = (data.address || "").trim();
    const country = (data.country || "India").trim();
    const requestedAuditDate = (data.requestedAuditDate || "").trim();
    const requestedAuditDateFormatted = (data.requestedAuditDateFormatted || requestedAuditDate).trim();
    const notes = (data.notes || "").trim();

    const cleanDigits = contact.replace(/[^0-9+]/g, "");

    // 1. Dispatch VIP Embed to Discord
    if (DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        username: "Northex Audit Desk",
        avatar_url: "https://raw.githubusercontent.com/Zcross091/agency-backup/main/favicon.png",
        embeds: [
          {
            title: "🗓️ NEW FREE GROWTH AUDIT BOOKING REQUEST",
            description: `A prospect has selected a preferred date for their 1-on-1 Free Growth Audit on **${requestedAuditDateFormatted || requestedAuditDate}**.`,
            color: 0xFFD3AC,
            fields: [
              { name: "📅 Requested Meeting Date", value: `**${requestedAuditDateFormatted || requestedAuditDate}**`, inline: true },
              { name: "👤 Client Name", value: `**${name || "Valued Prospect"}**`, inline: true },
              { name: "💼 Business / Brand", value: `**${business || "N/A"}**`, inline: true },
              { name: "📍 Business Address / HQ", value: `\`${address || "N/A"}\``, inline: true },
              { name: "🌍 Country", value: `\`${country}\``, inline: true },
              { name: "📞 Phone / WhatsApp", value: contact ? `[\`${contact}\`](tel:${cleanDigits})` : "*Not provided*", inline: true },
              { name: "✉️ Email Address", value: email ? `[${email}](mailto:${email})` : "*Not provided*", inline: true },
              { name: "⏰ Submitted At", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
              { name: "🎯 Goals & Growth Notes", value: `\`\`\`fix\n${(notes || "None specified").slice(0, 1000)}\n\`\`\``, inline: false },
              { name: "⚡ Action Required", value: `Reach out to client via WhatsApp/Email to schedule the consultation time on **${requestedAuditDateFormatted || requestedAuditDate}**.`, inline: false }
            ],
            footer: {
              text: "Northex Growth Audit Engine • Cloud Dispatch",
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

    // 2. Dispatch to Google Sheets
    if (GOOGLE_SHEET_WEBHOOK_URL) {
      const smartNeeds = `📅 REQUESTED AUDIT DATE: ${requestedAuditDateFormatted || requestedAuditDate}\n📍 Address: ${address || "N/A"}${notes ? "\nNotes: " + notes : ""}`.trim();
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          needs: smartNeeds
        })
      }).catch(err => console.warn("Google Sheet webhook note:", err));
    }

    return res.status(200).json({ success: true, message: "Growth Audit request processed successfully." });
  } catch (err) {
    console.error("Vercel Serverless Function error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
