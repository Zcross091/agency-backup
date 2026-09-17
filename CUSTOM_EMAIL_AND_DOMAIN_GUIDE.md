# Northlane Agency: Custom Domain, CNAME & Free Business Email Master Guide

> **Lakshya (Goal)**: Jab aap Northlane ke liye domain khareedenge (jaise `northlane.com`), toh apni website ko connect karna, aur bina kisi monthly charges ke **100% Free** professional email (jaise `support@northlane.com`) banana jisme **Password, Password Change, Account Login, aur Logout** sabhi features ho.

---

## 1. Important Concept: CNAME vs MX Record Kya Hota Hai?

Internet par do alag-alag records use hote hain:

1. **CNAME Record (Canonical Name)**:
   - Ye **Website / Subdomain** ke liye hota hai.
   - Example: Jab koi browser me `agency.northlane.com` ya `www.northlane.com` kholega, toh CNAME use aapki hosting / server par redirect karta hai.
2. **MX Record (Mail Exchange)**:
   - Ye **Emails** ke liye hota hai (jaise `support@northlane.com`).
   - Ye internet ko batata hai ki `support@northlane.com` par aane wala email kis mail server par deliver hona chahiye.

Aapka ye website setup dono ke liye **100% ready** hai!

---

## 2. Option A (Recommended): 100% Free Business Email with Dedicated Password, Login & Logout (Zoho Mail Free)

Agar aapko ek alag professional inbox chahiye jiska **ek apna Password ho**, jise aap **Login** kar sakein, **Password change** kar sakein, aur **Logout** kar sakein, toh **Zoho Mail Forever Free Plan** sabse best hai (5 Free Business Accounts).

### Step-by-Step Setup:

#### Step 1: Sign up on Zoho Mail Free
1. [zoho.com/mail/zohomail-pricing.html](https://www.zoho.com/mail/zohomail-pricing.html) par jayein.
2. Page ke neeche scroll karein aur **"Forever Free Plan"** select karein.
3. Apna Domain name enter karein (e.g. `northlane.com`).

#### Step 2: DNS Records Add Karna (Apne Domain Registrar me):
Apne Domain provider (Cloudflare / Namecheap / GoDaddy / Hostinger) ke **DNS Management** me ye 3 records dalein:

| Type | Name / Host | Value / Target | Priority |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `mx.zoho.in` (or `mx.zoho.com`) | 10 |
| **MX** | `@` | `mx2.zoho.in` (or `mx2.zoho.com`) | 20 |
| **TXT (SPF)**| `@` | `v=spf1 include:zoho.in ~all` | - |

#### Step 3: Username & Password Banana
1. Setup wizard me apna email ID choose karein: **`support@northlane.com`**.
2. Apna **Strong Password** set karein (e.g., `Northlane#Support2026`).

---

### Step 4: Login, Password Change aur Logout Kaise Karein?

#### 🔑 Account Login Kaise Karein:
1. Browser me jayein: **[mail.zoho.com](https://mail.zoho.com)**
2. Apna email dalein: `support@northlane.com`
3. Apna password enter karein.
4. ✅ Aapka official Northlane agency inbox open ho jayega! Yahan se aap clients ko emails bhej sakte hain aur unke replies receive kar sakte hain.

#### 🔄 Password Change Kaise Karein:
1. `mail.zoho.com` me login hone ke baad, top right corner par apni **Profile Icon** par click karein.
2. **"My Account"** (accounts.zoho.com) par click karein.
3. Left menu me **"Security"** select karein.
4. **"Change Password"** par click karein:
   - Apna purana password enter karein.
   - Naya password enter karein.
   - **Save** par click karein.

#### 🚪 Account Logout Kaise Karein:
1. Top right corner par apni **Profile Avatar / Photo** par click karein.
2. Red **"Sign Out" / "Logout"** button par click karein.
3. Aapka session securely close ho jayega.

---

## 3. Option B: Cloudflare Free Email Routing (Directly Inside Your Gmail)

Agar aap alag login nahi chahte aur chahte hain ki `support@northlane.com` par aane wale saare client emails seedhe aapke **`Start.agency911@gmail.com`** par aayein aur aap wahin se reply kar sakein:

1. Apne domain ko **Cloudflare** par add karein (Cloudflare DNS 100% free hai).
2. Cloudflare Dashboard me **"Email Routing"** par click karein.
3. **Custom Address**: `support@northlane.com`
4. **Destination Address**: `Start.agency911@gmail.com`
5. Verification email confirm karein.
6. **Result**: Koi bhi client jab `support@northlane.com` par email bhejega, toh wo automatically aapke Gmail inbox par drop hoga!

---

## 4. Website ko Domain / CNAME se Kaise Connect Karein?

Jab aap domain khareedenge:

1. **Agar aap Cloudflare Tunnel ya Vercel/Netlify par host kar rahe hain**:
   - Apne DNS settings me CNAME record banayein:
     - **Type**: `CNAME`
     - **Name**: `www` (ya `@` root)
     - **Target**: Aapka server URL / tunnel URL (e.g. `your-app.trycloudflare.com` ya `cname.vercel-dns.com`)
     - **Proxy**: Active (Orange Cloud)
2. **Agar direct VPS IP hai**:
   - **Type**: `A` Record
   - **Name**: `@`
   - **Value**: Aapke server ka public IP (e.g. `144.24.156.140`)

---

## 5. Summary Checklist

- [x] Website code me official email **`Start.agency911@gmail.com`** pre-configured hai.
- [x] Client Intake Form ready hai (Name, Contact, Email, Address, Country, Business, Needs).
- [x] Data automatic email trigger ke liye tayyar hai.
- [x] Domain lene ke baad aap upar diye steps se 5 minute me `support@northlane.com` activate kar sakte hain.
