# 📋 Complete Google Sheets Lead Pipeline & Attribution Guide

This guide contains the exact Google Apps Script to connect your website forms (both the **Lead Intake Form** and the **Free Growth Audit Booking**) to your Google Sheet (`1a8Tlbr5oCARbBO_Ial2s1IZACPZCQbxV4esPK_vLT_Q`), send email notifications, and dispatch rich VIP embeds to Discord with **first-party cookie attribution and device intelligence**.

---

## ⚡ Complete Google Apps Script (Copy & Paste)

Paste this entire script into your Google Sheet under **Extensions → Apps Script**:

```javascript
// ============================================================================
// NORTHEX EXECUTIVE LEAD PIPELINE & ATTRIBUTION DISPATCH ENGINE
// Google Sheet ID: 1a8Tlbr5oCARbBO_Ial2s1IZACPZCQbxV4esPK_vLT_Q
// ============================================================================

// 1. Sheet Connection Resolver
function getSheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active.getActiveSheet();
  } catch (e) {}
  return SpreadsheetApp.openById("1a8Tlbr5oCARbBO_Ial2s1IZACPZCQbxV4esPK_vLT_Q").getActiveSheet();
}

// 2. Helper to Send Email via GmailApp (Primary) or MailApp (Fallback)
function sendLeadEmail(recipient, subject, htmlBody, replyToEmail) {
  var options = {
    name: "Northex Leads",
    htmlBody: htmlBody
  };
  if (replyToEmail && replyToEmail.indexOf("@") !== -1) {
    options.replyTo = replyToEmail;
  }

  try {
    GmailApp.sendEmail(recipient, subject, "", options);
    Logger.log("Email sent via GmailApp to: " + recipient);
    return true;
  } catch (err1) {
    Logger.log("GmailApp failed (" + err1.toString() + "), trying MailApp...");
    try {
      options.to = recipient;
      options.subject = subject;
      MailApp.sendEmail(options);
      Logger.log("Email sent via MailApp to: " + recipient);
      return true;
    } catch (err2) {
      Logger.log("MailApp also failed: " + err2.toString());
      return false;
    }
  }
}

// 3. Webhook Entry Point (Triggered automatically when website form is submitted)
function doPost(e) {
  try {
    var sheet = getSheet();
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var name = (data.name || "").toString().trim();
    var rawPhone = (data.contact || data.phone || "").toString().trim();
    var cleanPhone = rawPhone.replace(/^'+/, "");
    var email = (data.email || "").toString().trim();
    var country = (data.country || "Not Specified").toString().trim();
    var business = (data.business || data.category || "").toString().trim();
    var needs = (data.needs || "").toString().trim();
    var time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Cookie Attribution & Device Intelligence
    var attr = data.attribution || {};
    var utmSource = (data.utm_source || attr.utmSource || "direct").toString().trim();
    var utmMedium = (data.utm_medium || attr.utmMedium || "").toString().trim();
    var utmCampaign = (data.utm_campaign || attr.utmCampaign || "none").toString().trim();
    var adClickId = (data.ad_click_id || attr.adClickId || "").toString().trim();
    var adPlatform = (data.ad_platform || attr.adPlatform || "Direct").toString().trim();
    var deviceType = (data.device_type || attr.deviceType || "Desktop").toString().trim();
    var os = (data.os || attr.os || "").toString().trim();
    var visitCount = (data.visit_count || attr.visitCount || 1).toString().trim();
    var visitorId = (data.visitor_id || attr.visitorId || "").toString().trim();
    var timezone = (data.timezone || attr.timezone || "").toString().trim();

    var fullDevice = deviceType + (os ? " (" + os + ")" : "");
    var fullSource = utmSource + (utmMedium ? " / " + utmMedium : "");

    // Headers management (Columns A to M)
    var headers = ["Name", "Phone no.", "Email", "Country", "Business Category", "Needs / Message", "Date & Time", "Device", "Source", "Campaign", "Ad Click ID", "Visit #", "Visitor ID"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#FFD3AC").setFontColor("#1A0E0A");
      sheet.setFrozenRows(1);
    } else {
      // Ensure columns H-M have headers if user previously only had A-G
      var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      for (var h = 0; h < headers.length; h++) {
        if (!firstRow[h]) {
          sheet.getRange(1, h + 1).setValue(headers[h]).setFontWeight("bold").setBackground("#FFD3AC").setFontColor("#1A0E0A");
        }
      }
    }

    // Append lead to Sheet
    var newRowIndex = sheet.getLastRow() + 1;
    sheet.appendRow([
      name,
      "",       // placeholder for phone (formatted as text below)
      email,
      country,
      business,
      needs,
      time,
      fullDevice,
      fullSource,
      utmCampaign,
      adClickId || "N/A",
      visitCount,
      visitorId || "N/A"
    ]);

    // Force phone column as plain text to prevent formula errors
    var phoneCell = sheet.getRange(newRowIndex, 2);
    phoneCell.setNumberFormat("@");
    phoneCell.setValue(cleanPhone);

    // Prepare HTML Email
    var subject = "🔥 New Northex Lead: " + (business ? business + " - " : "") + (name || "Incoming Prospect");
    var htmlBody = 
      "<div style='font-family: Arial, sans-serif; padding: 24px; background: #0A0F1D; color: #F1F5F9; border-radius: 12px; border: 1px solid #FFD3AC; max-width: 650px;'>" +
        "<h2 style='color: #FFD3AC; margin-top: 0;'>New Client Inquiry Received</h2>" +
        "<p style='color: #94A3B8;'>A new prospect submitted their details on your Northex website:</p>" +
        "<table style='width: 100%; border-collapse: collapse; margin: 16px 0; background: #131B2E; border-radius: 8px; overflow: hidden;'>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold; width: 30%;'>Name:</td><td style='padding: 12px 16px; color: #FFF; font-weight: bold;'>" + (name || "Not provided") + "</td></tr>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Phone:</td><td style='padding: 12px 16px;'><a href='tel:" + cleanPhone + "' style='color: #34D399; text-decoration: none; font-weight: bold;'>" + cleanPhone + "</a></td></tr>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Email:</td><td style='padding: 12px 16px;'><a href='mailto:" + email + "' style='color: #38BDF8; text-decoration: none;'>" + email + "</a></td></tr>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Country:</td><td style='padding: 12px 16px; color: #E2E8F0;'>" + country + "</td></tr>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Business:</td><td style='padding: 12px 16px; color: #FFD3AC; font-weight: bold;'>" + business + "</td></tr>" +
          "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Device / Source:</td><td style='padding: 12px 16px; color: #E2E8F0;'>" + fullDevice + " • " + fullSource + (utmCampaign !== "none" ? " [" + utmCampaign + "]" : "") + "</td></tr>" +
          (adClickId ? "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Ad Click ID:</td><td style='padding: 12px 16px; color: #A7F3D0; font-family: monospace; font-size: 11px;'>" + adClickId + " (" + adPlatform + ")</td></tr>" : "") +
          "<tr><td style='padding: 12px 16px; color: #94A3B8; font-weight: bold;'>Needs / Notes:</td><td style='padding: 12px 16px; color: #E2E8F0;'>" + (needs || "None specified") + "</td></tr>" +
        "</table>" +
        "<p style='color: #64748B; font-size: 12px; margin-bottom: 0;'>Logged: " + time + " • Visit #" + visitCount + " • Northex Lead Intake</p>" +
      "</div>";

    // Send to recipients
    var recipients = ["support@northexmarketing.com", "endeavouron091@gmail.com"];
    for (var i = 0; i < recipients.length; i++) {
      sendLeadEmail(recipients[i], subject, htmlBody, email);
    }

    // Send Discord VIP Embed
    try {
      var discordWebhookUrl = "https://discord.com/api/webhooks/1546899444933333244/b7Yd7ViuySu23i9e_pITC01e24Wl6OyiPZKNqo4TTYDaSJ8fkGiUkKbFCtc2eLAa0Wh9";
      var discordPayload = {
        username: "Northex Executive Desk",
        avatar_url: "https://raw.githubusercontent.com/Zcross091/agency-backup/main/favicon.png",
        embeds: [{
          title: "🌟 NEW INCOMING CLIENT INQUIRY",
          description: "A new strategic consultation request was submitted via the agency website.",
          color: 16765868,
          fields: [
            { name: "👤 Client Name", value: "**" + (name || "Valued Client") + "**", inline: true },
            { name: "💼 Business / Brand", value: "**" + (business || "N/A") + "**", inline: true },
            { name: "🌍 Country", value: country || "Not Specified", inline: true },
            { name: "📞 Phone / WhatsApp", value: cleanPhone ? "**" + cleanPhone + "**" : "Not provided", inline: true },
            { name: "✉️ Email Address", value: email || "Not provided", inline: true },
            { name: "⏰ Submitted At", value: time, inline: true },
            {
              name: "🎯 Marketing Attribution & Device Intelligence",
              value: [
                "• **Device:** " + fullDevice,
                "• **Acquisition Source:** " + fullSource + " • Campaign: `" + utmCampaign + "`",
                (adClickId ? "• **Ad Click ID (" + adPlatform + "):** `" + (adClickId.length > 32 ? adClickId.substring(0, 32) + "..." : adClickId) + "`" : null),
                "• **Visitor Journey:** Visit #" + visitCount + (timezone ? " • Timezone: `" + timezone + "`" : ""),
                (visitorId ? "• **Visitor ID:** `" + (visitorId.length > 24 ? visitorId.substring(0, 24) + "..." : visitorId) + "`" : null)
              ].filter(function(x) { return x !== null; }).join("\n"),
              inline: false
            },
            { name: "🎯 Goals & Business Requirements", value: needs ? ("> " + needs.split("\n").join("\n> ")) : "None specified", inline: false }
          ],
          footer: {
            text: "Northex Performance Marketing OS • Automated Lead Dispatch",
            icon_url: "https://raw.githubusercontent.com/Zcross091/agency-backup/main/favicon.png"
          },
          timestamp: new Date().toISOString()
        }]
      };

      var dcParams = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(discordPayload),
        muteHttpExceptions: true
      };

      var dcRes = UrlFetchApp.fetch(discordWebhookUrl, dcParams);
      if (dcRes.getResponseCode() === 429) {
        Utilities.sleep(2500);
        UrlFetchApp.fetch(discordWebhookUrl, dcParams);
      }
    } catch (dcErr) {
      Logger.log("Discord error: " + dcErr.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Saved to sheet, email sent, and dispatched to Discord" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 4. Verification Ping (when opened in browser)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", service: "Northex Lead Intake Pipeline" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 5. One-Click Authorization & Live Test
function testLead() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: "Official Northex Test",
        contact: "+91 99999 11111",
        email: "support@northexmarketing.com",
        country: "Germany",
        business: "Growth Acceleration",
        needs: "Testing official Gmail authorization and attribution dispatch",
        utm_source: "instagram",
        utm_medium: "paid_social",
        utm_campaign: "scale_eu_2026",
        ad_click_id: "test_fbclid_12345",
        ad_platform: "Meta Ads",
        device_type: "Mobile",
        os: "iOS",
        visit_count: 2,
        visitor_id: "nx_v_test123",
        timezone: "Europe/Berlin"
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log("Test execution result: " + result.getContent());
}
```
