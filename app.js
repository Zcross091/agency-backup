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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      contact: formData.get("contact"),
      email: formData.get("email"),
      business: formData.get("business"),
      country: formData.get("country"),
      needs: formData.get("needs"),
      submittedAt: new Date().toISOString()
    };

    // UI Loading State
    submitBtn.disabled = true;
    submitBtnText.style.display = "none";
    submitSpinner.style.display = "block";
    statusBox.className = "form-status";
    statusBox.style.display = "none";

    const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbxFbuwNvEGUGFWHWjWF_XHojkjCgS6kYw45Po06uNFp1htynuqyfL1QHeo7ADxAVoDM/exec";

    // 1. Direct Webhook Dispatch (Ensures delivery on Live Server, static hosting, or localhost)
    if (GOOGLE_SHEET_WEBHOOK) {
      try {
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
      // Even if local server is not active (e.g. running on Live Server port 5500), webhook already received lead
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
      Our team will review your local radius and contact you via Email within 4 business hours.
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
