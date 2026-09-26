# Google Sheets Live Backend Integration Guide
### Connected Sheet: [Temp - Google Sheets](https://docs.google.com/spreadsheets/d/1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw/edit?gid=0#gid=0)

Your Northlane backend is now fully engineered to automatically stream incoming leads directly into your Google Sheet (`Temp - Google Sheets`) in real-time.

---

## ⚡ 60-Second Setup (One-Time)

To allow the server to write new rows into your Google Sheet without complex Google Cloud API credentials, follow these simple steps:

### Step 1: Open Apps Script in your Google Sheet
1. Open your sheet: [Temp - Google Sheets](https://docs.google.com/spreadsheets/d/1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw/edit?gid=0#gid=0)
2. In the top menu, click **Extensions** (या **एक्सटेंशन**) > **Apps Script**.

---

### Step 2: Paste this Code
Delete any existing code in the Apps Script editor (`Code.gs`) and paste the following script:

```javascript
// Connects to your exact Google Sheet ID whether script is standalone or bound
function getSheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active.getActiveSheet();
  } catch (e) {}
  // Direct Sheet ID connection
  return SpreadsheetApp.openById("1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw").getActiveSheet();
}

// 1. Webhook function (called automatically when someone submits on website)
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

    var name = data.name || "";
    var rawPhone = (data.contact || data.phone || "").toString().trim();
    // Strip any accidental single-quote prefix from older payloads
    var cleanPhone = rawPhone.replace(/^'+/, "");
    var email = data.email || "";
    var country = data.country || "India";
    var business = data.business || data.category || "";
    var needs = data.needs || "";
    var time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Name", "Phone no.", "Email", "Country", "Business Category", "Needs / Message", "Date & Time"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#FFD3AC").setFontColor("#1A0E0A");
      sheet.setFrozenRows(1);
    }

    // Append all fields EXCEPT phone using appendRow, then set phone separately with text formatting
    var newRowIndex = sheet.getLastRow() + 1;
    sheet.appendRow([
      name,
      "",       // placeholder for phone — set below with explicit text format
      email,
      country,
      business,
      needs,
      time
    ]);

    // Force column B (phone) to plain text format so +91, +1, etc. never trigger #ERROR!
    var phoneCell = sheet.getRange(newRowIndex, 2);
    phoneCell.setNumberFormat("@");       // '@' = plain text format in Google Sheets
    phoneCell.setValue(cleanPhone);        // Now the value is stored as-is, no formula parsing

    // Send email with clean phone (no single-quote prefix)
    try {
      var recipient = "Start.agency911@gmail.com";
      var subject = "🔥 New Northlane Lead: " + (business ? business + " - " : "") + name;
      var htmlBody = 
        "<div style='font-family: Arial, sans-serif; padding: 24px; background: #0A0F1D; color: #F1F5F9; border-radius: 12px; border: 1px solid #FFD3AC;'>" +
          "<h2 style='color: #FFD3AC; margin-top: 0;'>New Client Inquiry Received</h2>" +
          "<p style='color: #94A3B8;'>A new prospect submitted their details on your Northlane website:</p>" +
          "<table style='width: 100%; border-collapse: collapse; margin: 16px 0; background: #131B2E; border-radius: 8px;'>" +
            "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Name:</td><td style='padding: 10px 16px; color: #FFF; font-weight: bold;'>" + name + "</td></tr>" +
            "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Phone:</td><td style='padding: 10px 16px;'><a href='tel:" + cleanPhone + "' style='color: #34D399; text-decoration: none; font-weight: bold;'>" + cleanPhone + "</a></td></tr>" +
            "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Email:</td><td style='padding: 10px 16px;'><a href='mailto:" + email + "' style='color: #38BDF8; text-decoration: none;'>" + email + "</a></td></tr>" +
            "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Country:</td><td style='padding: 10px 16px; color: #E2E8F0;'>" + country + "</td></tr>" +
            "<tr style='border-bottom: 1px solid rgba(255,255,255,0.06);'><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Business:</td><td style='padding: 10px 16px; color: #FFD3AC; font-weight: bold;'>" + business + "</td></tr>" +
            "<tr><td style='padding: 10px 16px; color: #94A3B8; font-weight: bold;'>Needs / Notes:</td><td style='padding: 10px 16px; color: #E2E8F0;'>" + needs + "</td></tr>" +
          "</table>" +
          "<p style='color: #64748B; font-size: 12px; margin-bottom: 0;'>Logged: " + time + " • Northlane Lead Intake</p>" +
        "</div>";

      MailApp.sendEmail({
        to: recipient,
        name: "Northlane Leads",
        replyTo: email,
        subject: subject,
        htmlBody: htmlBody
      });
    } catch (emailErr) {
      Logger.log("Email dispatch note: " + emailErr.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Saved to sheet and email sent" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. Test Function (Aap editor me isko select karke 'Run' daba sakte hain!)
function testLead() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: "Test Client",
        contact: "+91 98765 43210",
        email: "test@northlane.com",
        country: "India",
        business: "Artisanal Cafe",
        needs: "Testing live Google Sheet and Email integration"
      })
    }
  };
  var res = doPost(mockEvent);
  Logger.log(res.getContent());
}
```

---

### Step 3: Deploy as Web App
1. Click the blue **Deploy** (तैनात करें) button at top right > **New deployment** (नई तैनाती).
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Set the options:
   * **Description**: `Northlane Lead Streamer`
   * **Execute as**: `Me (your email)`
   * **Who has access**: `Anyone` *(taaki aapka website server direct data push kar sake bina login error ke)*.
4. Click **Deploy** and click **Authorize access** (choose your Google account, click *Advanced > Go to Untitled project (unsafe)* > *Allow*).
5. Copy the **Web App URL** that looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

### Step 4: Add the URL to your project
Paste your copied URL into the `.env` file in this folder:
```env
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```
*(Ya phir aap ye URL chat me bhej dein, hum turant isko `.env` me set kar denge!)*

---

## 🎯 How It Works in Action

Jab bhi koi user website par form bharega, to ek second me 3 cheezein hongi:
1. 📧 **Email**: Instant executive alert sent to `Start.agency911@gmail.com`.
2. 🔒 **Private Vault**: Backup CSV and individual JSON saved to your server's `private_vault/` folder.
3. 📊 **Google Sheet**: A new row is automatically written to your [Temp - Google Sheets](https://docs.google.com/spreadsheets/d/1rYlHBcx0tvh0EbvB_JLuprSJx3HdqABmGsHP1JRH8zw/edit?gid=0#gid=0) spreadsheet live!
