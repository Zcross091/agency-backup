# Northlane Private Vault & Multi-Channel Lead Storage Architecture

Yes! Whenever a prospective client submits their details on the Northlane website, the system automatically triggers a **simultaneous dual-pipeline**:
1. **Instant Direct Email Alert**: Sent immediately to **`Start.agency911@gmail.com`** with 1-click email response and phone call buttons.
2. **Private Server Vault Archival**: Stored securely on the server in a protected directory (**`private_vault/`**) that is completely inaccessible to visitors on the public internet.

---

## 📂 Private Server Directory Structure

On the server, leads are archived into multiple redundant, structured formats:

```
Northlane Marketing Management System/
│
├── private_vault/                           <-- 🔒 PROTECTED FOLDER (HTTP 403 Forbidden to public)
│   ├── all_leads.csv                        <-- 📊 Master Spreadsheet (Excel / Google Sheets ready)
│   ├── leads_ledger.json                    <-- 📑 Consolidated JSON Database
│   └── leads/                               <-- 📁 Individual timestamped client dossiers
│       ├── lead_2026-09-17_rohan_mehta.json
│       ├── lead_2026-09-17_aarav_sharma.json
│       └── ...
│
├── index.html                               <-- Public files
├── style.css
├── app.js
└── server.js                                <-- Backend engine + Security firewall
```

---

## 🔒 How Security & Privacy Are Enforced

The server engine (`server.js`) includes an automatic security filter:
* Any request attempting to access `/private_vault/`, `leads.json`, or any `.csv` / `.json` file from a web browser is **instantly rejected with `HTTP 403 Forbidden`**:
  ```json
  { "error": "Access Denied: Private Vault and storage files are protected." }
  ```
* Only you (the server owner / administrator) can access these files through your secure server access (SSH, SFTP, FileZilla, or Hosting Control Panel).

---

## 📊 Data Formats Saved Per Submission

### 1. `all_leads.csv` (Spreadsheet Format)
Every lead appends a new row automatically. You can double-click this file to open directly in **Microsoft Excel**, or upload it into **Google Sheets**:
```csv
Timestamp,Name,Phone,Email,Business,Country,Needs
"2026-09-17T10:14:10.172Z","Aarav Sharma","+91 98111 22334","aarav@delhibakes.in","Delhi Bakes Artisanal","India","Need automated VIP email marketing"
```

### 2. Individual JSON Dossier (`private_vault/leads/lead_TIMESTAMP_name.json`)
Each lead has its own dedicated JSON snapshot:
```json
{
  "name": "Aarav Sharma",
  "contact": "+91 98111 22334",
  "email": "aarav@delhibakes.in",
  "business": "Delhi Bakes Artisanal",
  "country": "India",
  "needs": "Need automated VIP email marketing",
  "receivedAt": "2026-09-17T10:14:10.172Z"
}
```

---

## 🌐 How to Access This Private Folder When Deployed on a Server

When you deploy your website to a live VPS (Hostinger, AWS, DigitalOcean, Hetzner, or cPanel):

1. **Via SFTP / FileZilla (Easiest)**:
   - Connect using Hostinger/cPanel SFTP credentials.
   - Navigate to `/your-app/private_vault/`.
   - Download `all_leads.csv` or view lead files directly.
2. **Via Linux SSH Terminal**:
   ```bash
   # View all leads in real-time on your server:
   cat private_vault/all_leads.csv

   # Or list all individual lead files:
   ls -la private_vault/leads/
   ```
3. **Optional Auto-Backup**:
   - You can set up a simple cron job on your server to sync `private_vault/` to a private Google Drive or Dropbox folder every night.
