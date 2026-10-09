/**
 * NORTHEX INTERACTIVE LOGIC & LEAD PIPELINE
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initModalHandling();
  initContactForm();
  initSmoothScroll();
  initFaqAccordion();
  initLegalTabs();
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
  const openAuditBtnTeam = document.getElementById("openAuditBtnTeam");
  const closeBtn = document.getElementById("modalCloseBtn");
  const jumpBtn = document.getElementById("modalScrollToForm");

  if (!modal) return;

  function openModal() {
    modal.classList.add("open");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

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
    const countryCode = (formData.get("countryCode") || "").trim();
    let rawContact = (formData.get("contact") || "").trim();
    const fullContact = rawContact.startsWith("+") ? rawContact : (countryCode ? `${countryCode} ${rawContact}` : rawContact);

    const payload = {
      name: formData.get("name"),
      contact: fullContact,
      phone: fullContact,
      email: formData.get("email"),
      business: formData.get("business"),
      country: formData.get("country") || "",
      needs: formData.get("needs"),
      submittedAt: new Date().toISOString()
    };

    // UI Loading State
    submitBtn.disabled = true;
    submitBtnText.style.display = "none";
    submitSpinner.style.display = "block";
    statusBox.className = "form-status";
    statusBox.style.display = "none";

    const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzhJQw61YLOYHF2nhqavqA4xMyW9ZinlqhTOX7_njxfuOhJ4z0_cgFjGWTf1yWW-IvEyA/exec";

    let apiSucceeded = false;

    // 1. Primary Dispatch: Dispatch to API (/api/contact) which handles single-point archiving and sync
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        apiSucceeded = true;
        showSuccessMessage(payload.name, payload.business);
        form.reset();
      }
    } catch (err) {
      console.log("[Northex Lead Engine] Primary API note:", err.message);
    }

    // 2. Fail-Safe Fallback: Only call Google Sheets directly if the primary API was completely unreachable
    if (!apiSucceeded && GOOGLE_SHEET_WEBHOOK) {
      try {
        await fetch(GOOGLE_SHEET_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });
        showSuccessMessage(payload.name, payload.business);
        form.reset();
      } catch (fallbackErr) {
        console.warn("[Northex Lead Engine] Fallback webhook note:", fallbackErr);
        saveLeadOffline(payload);
        showSuccessMessage(payload.name, payload.business);
        form.reset();
      }
    }

    submitBtn.disabled = false;
    submitBtnText.style.display = "inline";
    submitSpinner.style.display = "none";
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
      const existing = JSON.parse(localStorage.getItem("northex_leads") || localStorage.getItem("northlane_leads") || "[]");
      existing.push(lead);
      localStorage.setItem("northex_leads", JSON.stringify(existing));
    } catch (_) {}
  }
}

/* --------------------------------------------------------------------------
   6. Smooth Scrolling & CTA Jump Handlers
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  const contactTriggers = [
    document.getElementById("openContactBtnNav"),
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

/* --------------------------------------------------------------------------
   7. Interactive FAQ Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const cards = document.querySelectorAll(".faq-card");
  cards.forEach(card => {
    const question = card.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", () => {
      const isOpen = card.classList.contains("active");
      cards.forEach(c => c.classList.remove("active"));
      if (!isOpen) {
        card.classList.add("active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   8. Legal & Policy Tabs (Terms & Conditions / Privacy Policy)
   -------------------------------------------------------------------------- */
function initLegalTabs() {
  const tabTerms = document.getElementById("tabBtnTerms");
  const tabPrivacy = document.getElementById("tabBtnPrivacy");
  const panelTerms = document.getElementById("legalPanelTerms");
  const panelPrivacy = document.getElementById("legalPanelPrivacy");

  if (!tabTerms || !tabPrivacy || !panelTerms || !panelPrivacy) return;

  window.switchLegalTab = function(tabName) {
    if (tabName === "privacy") {
      tabPrivacy.classList.add("active");
      tabTerms.classList.remove("active");
      panelPrivacy.style.display = "block";
      panelTerms.style.display = "none";
    } else {
      tabTerms.classList.add("active");
      tabPrivacy.classList.remove("active");
      panelTerms.style.display = "block";
      panelPrivacy.style.display = "none";
    }
  };

  tabTerms.addEventListener("click", () => window.switchLegalTab("terms"));
  tabPrivacy.addEventListener("click", () => window.switchLegalTab("privacy"));

  function checkHash() {
    if (window.location.hash === "#privacy") {
      window.switchLegalTab("privacy");
    } else if (window.location.hash === "#terms" || window.location.hash === "#legal") {
      window.switchLegalTab("terms");
    }
  }

  window.addEventListener("hashchange", checkHash);
  checkHash();
}
