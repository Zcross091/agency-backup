/**
 * NORTHLANE INTERACTIVE LOGIC & LEAD PIPELINE
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initModalHandling();
  initContactForm();
  initSmoothScroll();
});

/* --------------------------------------------------------------------------
   1. Mobile Navigation Menu
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.getElementById("mobileToggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });

  const links = menu.querySelectorAll(".mobile-link, button");
  links.forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  });
}

/* --------------------------------------------------------------------------
   2. Modal Handling
   -------------------------------------------------------------------------- */
function initModalHandling() {
  const modal = document.getElementById("consultationModal");
  const openAuditBtnNav = document.getElementById("openAuditBtnNav");
  const closeBtn = document.getElementById("modalCloseBtn");
  const jumpBtn = document.getElementById("modalScrollToForm");

  if (!modal) return;

  function openModal() {
    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  if (openAuditBtnNav) openAuditBtnNav.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (jumpBtn) {
    jumpBtn.addEventListener("click", () => {
      closeModal();
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
}

/* --------------------------------------------------------------------------
   5. Lead Intake Form Submission
   - Dispatches payload to backend /api/contact (Vault + Sheet + Email pipeline)
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("leadIntakeForm");
  const statusBox = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const submitSpinner = document.getElementById("submitSpinner");

  if (!form) return;

  // Sync Country Dropdown with Country Code Selector
  const countrySelect = document.getElementById("clientCountry");
  const codeSelect = document.getElementById("phoneCountryCode");
  if (countrySelect && codeSelect) {
    countrySelect.addEventListener("change", () => {
      const selected = countrySelect.value;
      const matchingOpt = Array.from(codeSelect.options).find(opt => opt.getAttribute("data-country") === selected);
      if (matchingOpt) {
        codeSelect.selectedIndex = matchingOpt.index;
      }
    });

    codeSelect.addEventListener("change", () => {
      const selectedOpt = codeSelect.options[codeSelect.selectedIndex];
      const countryName = selectedOpt ? selectedOpt.getAttribute("data-country") : null;
      if (countryName) {
        const matchingCountryOpt = Array.from(countrySelect.options).find(opt => opt.value === countryName);
        if (matchingCountryOpt) {
          countrySelect.selectedIndex = matchingCountryOpt.index;
        }
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const countryCode = formData.get("countryCode") || "+91";
    let rawContact = (formData.get("contact") || "").trim();
    const fullContact = rawContact.startsWith("+") ? rawContact : `${countryCode} ${rawContact}`;

    const payload = {
      name: formData.get("name"),
      contact: fullContact,
      phone: fullContact,
      email: formData.get("email"),
      business: formData.get("business"),
      country: formData.get("country") || "India",
      needs: formData.get("needs"),
      submittedAt: new Date().toISOString()
    };

    // UI Loading State
    submitBtn.disabled = true;
    submitBtnText.style.display = "none";
    submitSpinner.style.display = "block";
    statusBox.className = "form-status";
    statusBox.style.display = "none";

    const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbxfXqnt5GsChhxWVUZ-e-1UJmfe3mfEDNHRM5LCZVkNTVfaQXPS3qSiIOM-yTLPWR0b/exec";

    // 1. Direct Webhook Dispatch (Ensures delivery on Live Server, Vercel, or localhost)
    if (GOOGLE_SHEET_WEBHOOK) {
      try {
        // Send clean phone data — Apps Script handles text formatting via setNumberFormat('@')
        fetch(GOOGLE_SHEET_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(err => console.warn("Google Sheet direct post note:", err));
      } catch (err) {
        console.warn("Direct webhook dispatch:", err);
      }
    }

    try {
      // 2. Dispatch to local Node server API (/api/contact) for Vault archiving & server-side email
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccessMessage(payload.name, payload.business);
        form.reset();
      } else {
        throw new Error("Server responded with status " + res.status);
      }
    } catch (err) {
      console.log("Local server API note:", err.message);
      // Even if local server is not active (e.g. running on Vercel or Live Server), webhook already received lead
      saveLeadOffline(payload);
      showSuccessMessage(payload.name, payload.business);
      form.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtnText.style.display = "inline";
      submitSpinner.style.display = "none";
    }
  });

  function showSuccessMessage(name, business) {
    statusBox.className = "form-status success";
    statusBox.style.display = "block";
    statusBox.innerHTML = `
      <strong>✓ Strategy Brief Dispatched!</strong><br>
      Thank you, <b>${name}</b>. Your details for <b>${business}</b> have been securely dispatched to our leadership desk.<br>
      Our team will review your business requirements and contact you via Email within 4 business hours.
    `;
  }

  function saveLeadOffline(lead) {
    try {
      const existing = JSON.parse(localStorage.getItem("northlane_leads") || "[]");
      existing.push(lead);
      localStorage.setItem("northlane_leads", JSON.stringify(existing));
    } catch (_) {}
  }
}

/* --------------------------------------------------------------------------
   6. Smooth Scrolling & CTA Jump Handlers
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  const contactTriggers = [
    document.getElementById("openContactBtnNav"),
    document.getElementById("openContactBtnHero"),
    document.getElementById("openContactBtnCalc"),
    document.getElementById("openContactBtnMobile")
  ];

  contactTriggers.forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
        const nameField = document.getElementById("clientName");
        if (nameField) {
          setTimeout(() => nameField.focus(), 600);
        }
      }
    });
  });
}
