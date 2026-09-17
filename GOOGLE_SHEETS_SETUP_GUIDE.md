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
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Auto-create styled header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Client Name",
        "Phone / Contact",
        "Email Address",
        "Business Name",
        "Country",
        "Business Needs & Questions"
      ]);
      sheet.getRange(1, 1, 1, 7)
        .setFontWeight("bold")
        .setBackground("#FFD3AC")
        .setFontColor("#1A0E0A")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // Append the incoming lead row
    sheet.appendRow([
      data.receivedAt || new Date().toISOString(),
      data.name || "",
      data.contact || "",
      data.email || "",
      data.business || "",
      data.country || "India",
      data.needs || ""
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Lead added" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
