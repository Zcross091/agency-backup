const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Simple auto-load for .env if present
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const PORT = process.env.PORT || 3000;
const AGENCY_EMAIL = process.env.AGENCY_EMAIL || "Start.agency911@gmail.com";
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD || process.env.temporary_company_email_password || "Start@9368";
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw";
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";

// Nodemailer transporter setup
let transporter = null;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: AGENCY_EMAIL,
      pass: GMAIL_PASSWORD
    }
  });
} catch (err) {
  console.warn("[Northlane Server] Nodemailer initialization warning:", err.message);
}

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: /api/contact
  if (req.url === "/api/contact" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const name = data.name;
        const contact = data.contact || data.phone || "";
        const email = data.email;
        const business = data.business || "";
        const country = data.country || "India";
        const needs = data.needs || "";

        if (!name || !contact || !email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Name, contact, and email are required." }));
          return;
        }

        // 1. Secure Multi-Tier Private Vault Storage
        const vaultDir = path.join(__dirname, "private_vault");
        const leadsVaultDir = path.join(vaultDir, "leads");
        if (!fs.existsSync(leadsVaultDir)) {
          fs.mkdirSync(leadsVaultDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const safeSlug = (name || "lead").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
        const individualLeadFile = path.join(leadsVaultDir, `lead_${timestamp}_${safeSlug}.json`);
        
        const leadRecord = {
          ...data,
          receivedAt: new Date().toISOString()
        };

        // 1A. Save individual lead JSON file in private folder
        fs.writeFileSync(individualLeadFile, JSON.stringify(leadRecord, null, 2));

        // 1B. Save/Append to private Master CSV spreadsheet
        const csvFile = path.join(vaultDir, "all_leads.csv");
        const csvHeader = "Timestamp,Name,Phone,Email,Business,Country,Needs\n";
        const cleanField = str => `"${String(str || "").replace(/"/g, '""')}"`;
        const csvRow = [
          cleanField(leadRecord.receivedAt),
          cleanField(name),
          cleanField(contact),
          cleanField(email),
          cleanField(business || "N/A"),
          cleanField(country || "India"),
          cleanField(needs || "")
        ].join(",") + "\n";

        if (!fs.existsSync(csvFile)) {
          fs.writeFileSync(csvFile, csvHeader + csvRow, "utf-8");
        } else {
          fs.appendFileSync(csvFile, csvRow, "utf-8");
        }

        // 1C. Append to private Master JSON ledger
        const ledgerFile = path.join(vaultDir, "leads_ledger.json");
        let ledger = [];
        if (fs.existsSync(ledgerFile)) {
          try {
            ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf-8") || "[]");
          } catch (_) { ledger = []; }
        }
        ledger.unshift(leadRecord);
        fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));

        // 1D. Keep backwards-compatible root leads.json
        const rootLeadsFile = path.join(__dirname, "leads.json");
        fs.writeFileSync(rootLeadsFile, JSON.stringify(ledger, null, 2));

        console.log(`[Northlane Private Vault] Lead securely archived: ${individualLeadFile} & ${csvFile}`);

        // 2. Dispatch automated email alert to Start.agency911@gmail.com
        if (transporter) {
          const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0A0F1D; color: #F1F5F9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 229, 255, 0.2);">
              <div style="background: linear-gradient(135deg, #00E5FF, #10B981); padding: 24px 30px;">
                <h1 style="margin: 0; color: #050811; font-size: 22px; font-weight: 800; letter-spacing: 0.05em;">NORTHLANE • NEW PROSPECT INQUIRY</h1>
                <p style="margin: 4px 0 0; color: #050811; font-size: 13px; font-weight: 600;">Immediate Executive Growth Consultation Request</p>
              </div>

              <div style="padding: 30px;">
                <p style="font-size: 15px; color: #94A3B8; margin-top: 0;">A potential client has submitted their business details via the Northlane Agency portal:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #0F172A; border-radius: 10px; overflow: hidden;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: bold; width: 140px;">Client Name</td>
                    <td style="padding: 12px 18px; font-size: 14px; color: #FFFFFF; font-weight: 600;">${name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: bold;">Business Name</td>
                    <td style="padding: 12px 18px; font-size: 14px; color: #00E5FF; font-weight: 600;">${business || "N/A"}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: bold;">Contact / Phone</td>
                    <td style="padding: 12px 18px; font-size: 14px; color: #10B981; font-weight: bold;"><a href="tel:${contact}" style="color: #10B981; text-decoration: none;">${contact}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: bold;">Email Address</td>
                    <td style="padding: 12px 18px; font-size: 14px; color: #FFFFFF;"><a href="mailto:${email}" style="color: #00E5FF; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: bold;">Country</td>
                    <td style="padding: 12px 18px; font-size: 14px; color: #CBD5E1;">${country || "India"}</td>
                  </tr>
                </table>

                <div style="background: #0F172A; border-left: 3px solid #10B981; padding: 16px; border-radius: 6px; margin: 20px 0;">
                  <span style="display: block; font-size: 11px; font-weight: 700; color: #10B981; text-transform: uppercase; margin-bottom: 6px;">Client Needs & Questions:</span>
                  <p style="margin: 0; font-size: 14px; color: #E2E8F0; line-height: 1.5; white-space: pre-wrap;">${needs || "None specified"}</p>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="mailto:${email}?subject=Northlane%20Growth%20Audit%20Proposal%20for%20${encodeURIComponent(business || name)}" style="display: inline-block; background: #FFD3AC; color: #1a0f07; padding: 12px 24px; border-radius: 999px; font-weight: bold; font-size: 14px; text-decoration: none; margin-right: 8px;">
                    ✉️ Reply via Email to ${name}
                  </a>
                  <a href="tel:${contact.replace(/[^0-9+]/g, "")}" style="display: inline-block; background: #1E293B; color: #F8FAFC; padding: 12px 20px; border-radius: 999px; font-weight: bold; font-size: 14px; text-decoration: none;">
                    📞 Call ${contact}
                  </a>
                </div>
              </div>

              <div style="background: #060913; padding: 16px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #64748B;">
                Northlane Performance Marketing OS • Automated Lead Dispatch
              </div>
            </div>
          `;

          transporter.sendMail({
            from: `"Northlane Lead Intake" <${AGENCY_EMAIL}>`,
            to: AGENCY_EMAIL,
            replyTo: email,
            subject: `🔥 NEW CLIENT INQUIRY: ${business || name} (${contact})`,
            html: emailHtml
          }).then((info) => {
            console.log(`[Northlane Lead Engine] Email sent successfully to ${AGENCY_EMAIL} (MsgId: ${info.messageId})`);
          }).catch((err) => {
            console.warn(`[Northlane Lead Engine] Note on email delivery to ${AGENCY_EMAIL}:`, err.message);
          });
        }

        // 3. Sync lead to Google Sheet (Temp - Google Sheets: 1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw)
        if (GOOGLE_SHEET_WEBHOOK_URL) {
          syncToGoogleSheet(leadRecord);
        } else {
          console.log(`[Northlane Google Sheets Engine] Target Sheet ID: ${GOOGLE_SHEET_ID}. (Set GOOGLE_SHEET_WEBHOOK_URL in .env to stream rows live).`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          message: `Inquiry received for ${business || name}. Executive brief routed to ${AGENCY_EMAIL}.`
        }));
      } catch (err) {
        console.error("[Northlane Server] Error processing /api/contact:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Internal processing error." }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];

  // Security Protection: Block public web access to private vault, ledgers, and env files
  if (
    reqPath.startsWith("/private_vault") ||
    reqPath.includes("leads.json") ||
    reqPath.endsWith(".json") ||
    reqPath.endsWith(".csv") ||
    reqPath.endsWith(".env") ||
    reqPath.includes("..")
  ) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Access Denied: Private Vault and storage files are protected." }));
    return;
  }

  let filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, "index.html");
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 NORTHLANE ADVERTISING AGENCY WEBSITE ACTIVE`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📧 Leads Notification Target: ${AGENCY_EMAIL}`);
  console.log(`📊 Google Sheet Target: https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`);
  if (GOOGLE_SHEET_WEBHOOK_URL) {
    console.log(`🟢 Google Sheets Live Sync: CONNECTED`);
  } else {
    console.log(`🟡 Google Sheets Live Sync: Ready for Webhook URL (See GOOGLE_SHEETS_SETUP_GUIDE.md)`);
  }
  console.log(`========================================================\n`);
});

// Helper: Stream lead to Google Sheets Apps Script Webhook
async function syncToGoogleSheet(lead) {
  try {
    // Send clean phone data — Apps Script handles text formatting via setNumberFormat('@')
    const sheetData = { ...lead };

    const res = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheetData),
      redirect: "follow"
    });
    console.log(`[Northlane Google Sheets Engine] ✓ Lead successfully added to Google Sheet (HTTP ${res.status})`);
  } catch (err) {
    console.warn(`[Northlane Google Sheets Engine] Note on Google Sheet delivery:`, err.message);
  }
}
