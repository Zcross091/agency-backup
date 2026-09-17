# Northlane Performance Marketing Management System

Northlane is a full-service performance marketing and customer acquisition platform engineered for local businesses, artisanal bakeries, and retail brands.

## 🚀 Key Features
- **Client-Centric Frontend**: Modern dark-luxury design system (`#FFD3AC` cream accents) showcasing hyper-local Meta ads, automated retention systems, and proven client case studies.
- **Dynamic Revenue Potential Calculator**: Interactive slider projecting monthly order volume, local reach, and gross revenue.
- **Triple-Action Lead Pipeline**:
  1. **Private Vault**: Automatic local logging to `private_vault/` (`all_leads.csv` and individual JSON files) with HTTP 403 access security.
  2. **Automated Executive Alerts**: Direct email notification to agency leadership desk.
  3. **Google Sheets Real-Time Sync**: Webhook integration with Google Apps Script to append leads live to your operational spreadsheet.
- **Zero-WhatsApp Policy**: All customer communications streamlined via official email and scheduled strategy calls.
- **Official Brand Favicon & Headers**: Custom SVG and multi-format favicons for all modern desktop and mobile browsers.

## 🛠️ Tech Stack
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism), Vanilla JavaScript ES6+.
- **Backend**: Node.js HTTP Server (`server.js`) with Nodemailer and Google Sheets Webhook integration.
- **Security**: Strict static routing blocking `.env`, `.json`, `.csv`, and `/private_vault/` paths.

## 📦 Setup & Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Zcross091/agency-backup.git
   cd agency-backup
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Start the Server**:
   ```bash
   node server.js
   ```
   Open `http://localhost:3000` in your browser.

## 📄 Guides & Documentation
- [Google Sheets Setup Guide](GOOGLE_SHEETS_SETUP_GUIDE.md)
- [Private Vault & Storage Guide](PRIVATE_VAULT_AND_STORAGE_GUIDE.md)
- [Custom Email & Domain Setup Guide](CUSTOM_EMAIL_AND_DOMAIN_GUIDE.md)

## 🔒 License
Proprietary — All rights reserved © 2026 Northlane Marketing & Advertising Agency.
