/**
 * NORTHEX GROWTH AUDIT CALENDAR & BOOKING ENGINE
 * Bespoke Interactive Calendar, Validation, and Multi-Endpoint Dispatch
 */

document.addEventListener("DOMContentLoaded", () => {
  initAuditCalendar();
  initCountryPhoneSync();
  initAuditBookingForm();
});

/* --------------------------------------------------------------------------
   1. Interactive Calendar Engine
   -------------------------------------------------------------------------- */
let calCurrentYear;
let calCurrentMonth; // 0-indexed (0 = Jan, 9 = Oct)
let selectedAuditDate = null; // Date object

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

function initAuditCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calCurrentYear = today.getFullYear();
  calCurrentMonth = today.getMonth();

  const prevBtn = document.getElementById("calPrevBtn");
  const nextBtn = document.getElementById("calNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const now = new Date();
      // Do not navigate prior to current month
      if (calCurrentYear === now.getFullYear() && calCurrentMonth === now.getMonth()) {
        return;
      }
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderCalendar();
    });
  }

  // Presets handling
  const presetPills = document.querySelectorAll(".preset-pill");
  presetPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const offset = pill.getAttribute("data-offset");
      const presetType = pill.getAttribute("data-preset");
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      if (offset) {
        targetDate.setDate(targetDate.getDate() + parseInt(offset, 10));
      } else if (presetType === "next-monday") {
        const day = targetDate.getDay();
        const diff = (day === 0 ? 1 : 8 - day);
        targetDate.setDate(targetDate.getDate() + diff);
      } else if (presetType === "next-friday") {
        const day = targetDate.getDay();
        let diff = 5 - day;
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
      }

      // Navigate calendar to target date's month and select it
      calCurrentYear = targetDate.getFullYear();
      calCurrentMonth = targetDate.getMonth();
      selectDate(targetDate);
      renderCalendar();
    });
  });

  // Initial render
  renderCalendar();
}

function renderCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthYearDisplay = document.getElementById("calMonthYearDisplay");
  const daysGrid = document.getElementById("calendarDaysGrid");
  const prevBtn = document.getElementById("calPrevBtn");

  if (!monthYearDisplay || !daysGrid) return;

  monthYearDisplay.textContent = `${MONTH_NAMES[calCurrentMonth]} ${calCurrentYear}`;

  // Disable Prev button if at current month
  if (prevBtn) {
    const isAtCurrentMonth = calCurrentYear === today.getFullYear() && calCurrentMonth === today.getMonth();
    prevBtn.disabled = isAtCurrentMonth;
    prevBtn.style.opacity = isAtCurrentMonth ? "0.3" : "1";
    prevBtn.style.cursor = isAtCurrentMonth ? "not-allowed" : "pointer";
  }

  daysGrid.innerHTML = "";

  // Days calculations
  const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  // Empty leading spacer slots
  for (let i = 0; i < firstDayIndex; i++) {
    const spacer = document.createElement("div");
    spacer.className = "calendar-day day-empty";
    daysGrid.appendChild(spacer);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "calendar-day";
    dayBtn.textContent = day;

    const thisDate = new Date(calCurrentYear, calCurrentMonth, day);
    thisDate.setHours(0, 0, 0, 0);

    const isPast = thisDate < today;
    const isToday = thisDate.getTime() === today.getTime();
    const isSelected = selectedAuditDate && thisDate.getTime() === selectedAuditDate.getTime();

    if (isPast) {
      dayBtn.classList.add("day-past");
      dayBtn.setAttribute("disabled", "true");
      dayBtn.setAttribute("aria-disabled", "true");
    } else {
      dayBtn.classList.add("day-selectable");
      if (isToday) dayBtn.classList.add("day-today");
      if (isSelected) dayBtn.classList.add("day-selected");

      dayBtn.addEventListener("click", () => {
        selectDate(thisDate);
        renderCalendar();
      });
    }

    daysGrid.appendChild(dayBtn);
  }
}

function selectDate(dateObj) {
  selectedAuditDate = new Date(dateObj);
  selectedAuditDate.setHours(0, 0, 0, 0);

  const dayOfWeek = DAY_NAMES[selectedAuditDate.getDay()];
  const monthName = MONTH_NAMES[selectedAuditDate.getMonth()];
  const dayNum = selectedAuditDate.getDate();
  const year = selectedAuditDate.getFullYear();

  // Formatted Strings
  const formattedFull = `${dayOfWeek}, ${monthName} ${dayNum}, ${year}`;
  const isoShort = `${year}-${String(selectedAuditDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

  // Update Callout Display
  const selectedDateDisplay = document.getElementById("selectedDateDisplay");
  if (selectedDateDisplay) {
    selectedDateDisplay.textContent = formattedFull;
  }

  // Update Form Badge Indicator
  const activeDateBadgeText = document.getElementById("activeDateBadgeText");
  const formActiveDatePill = document.getElementById("formActiveDatePill");
  if (activeDateBadgeText) {
    activeDateBadgeText.textContent = `Target Date: ${formattedFull}`;
  }
  if (formActiveDatePill) {
    formActiveDatePill.classList.add("has-date");
  }

  // Update Hidden Inputs
  const hiddenDate = document.getElementById("requestedAuditDate");
  const hiddenDateFormatted = document.getElementById("requestedAuditDateFormatted");
  if (hiddenDate) hiddenDate.value = isoShort;
  if (hiddenDateFormatted) hiddenDateFormatted.value = formattedFull;

  // Update Submit Button Text
  const submitBtnText = document.getElementById("auditSubmitBtnText");
  if (submitBtnText) {
    submitBtnText.textContent = `Request Free Audit for ${monthName.slice(0, 3)} ${dayNum} →`;
  }

  // Clear any status error message
  const statusBox = document.getElementById("auditFormStatus");
  if (statusBox && statusBox.textContent.includes("calendar")) {
    statusBox.textContent = "";
    statusBox.className = "form-status";
  }
}

/* --------------------------------------------------------------------------
   2. Country & Phone Dial Code Synchronizer
   -------------------------------------------------------------------------- */
function initCountryPhoneSync() {
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
          countrySelect.value = countryName;
        }
      }
    });
  }
}

/* --------------------------------------------------------------------------
   3. Audit Booking Form Submission Pipeline
   -------------------------------------------------------------------------- */
function initAuditBookingForm() {
  const form = document.getElementById("auditBookingForm");
  const statusBox = document.getElementById("auditFormStatus");
  const submitBtn = document.getElementById("auditSubmitBtn");
  const submitBtnText = document.getElementById("auditSubmitBtnText");
  const submitSpinner = document.getElementById("auditSubmitSpinner");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Verify Date Selection
    const requestedDate = document.getElementById("requestedAuditDate").value;
    const requestedDateFormatted = document.getElementById("requestedAuditDateFormatted").value;

    if (!requestedDate) {
      statusBox.textContent = "Please tap any future date on the calendar first.";
      statusBox.className = "form-status error";
      
      const calendarCard = document.querySelector(".calendar-card");
      if (calendarCard) {
        calendarCard.scrollIntoView({ behavior: "smooth", block: "center" });
        calendarCard.classList.add("shake-attention");
        setTimeout(() => calendarCard.classList.remove("shake-attention"), 700);
      }
      return;
    }

    // 2. Extract & Validate Fields
    const name = document.getElementById("clientName").value.trim();
    const business = document.getElementById("clientBusiness").value.trim();
    const address = document.getElementById("clientAddress").value.trim();
    const country = document.getElementById("clientCountry").value.trim();
    const countryCode = document.getElementById("phoneCountryCode").value.trim();
    const rawContact = document.getElementById("clientContact").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const notes = document.getElementById("clientNotes").value.trim();

    if (!name || !business || !address || !country || !countryCode || !rawContact || !email) {
      statusBox.textContent = "Please fill in all required fields (Name, Business, Address, Country, Phone Code, Phone Number, Email).";
      statusBox.className = "form-status error";
      return;
    }

    // Email sanity check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      statusBox.textContent = "Please enter a valid business email address.";
      statusBox.className = "form-status error";
      return;
    }

    const cleanRawContact = rawContact.replace(/^'+/, "").trim();
    const fullPhone = `${countryCode} ${cleanRawContact}`.trim();

    // UI Loading State
    submitBtn.disabled = true;
    submitSpinner.style.display = "inline-block";
    submitBtnText.textContent = "Confirming Audit Booking...";
    statusBox.textContent = "";
    statusBox.className = "form-status";

    const payload = {
      type: "audit_booking",
      name,
      business,
      address,
      country,
      contact: fullPhone,
      phone: fullPhone,
      email,
      requestedAuditDate: requestedDate,
      requestedAuditDateFormatted: requestedDateFormatted,
      notes,
      submittedAt: new Date().toISOString()
    };

    const GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzhJQw61YLOYHF2nhqavqA4xMyW9ZinlqhTOX7_njxfuOhJ4z0_cgFjGWTf1yWW-IvEyA/exec";

    const smartNeeds = `📅 REQUESTED AUDIT DATE: ${requestedDateFormatted}\n📍 Business Address: ${address}\n${notes ? "Notes: " + notes : ""}`.trim();

    const cloudPayload = {
      ...payload,
      needs: smartNeeds
    };

    // 1. Direct Cloud Dispatch to Google Sheets & Apps Script Pipeline (Always active on Vercel, Live Domain, and Local)
    let cloudDispatchPromise = null;
    if (GOOGLE_SHEET_WEBHOOK) {
      try {
        cloudDispatchPromise = fetch(GOOGLE_SHEET_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(cloudPayload)
        }).catch(err => console.warn("[Audit Engine] Google Sheets cloud webhook note:", err));
      } catch (err) {
        console.warn("[Audit Engine] Direct webhook exception:", err);
      }
    }

    // 2. Dispatch to API Endpoint (/api/audit-booking) for Vercel Serverless Function & Local Vault Archiving
    try {
      const response = await fetch("/api/audit-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        console.log("[Audit Engine] API Endpoint responded successfully:", resData);
      }
    } catch (apiErr) {
      console.log("[Audit Engine] Local server API note (cloud webhook active):", apiErr.message);
    }

    // Await cloud dispatch confirmation and transition to success state
    if (cloudDispatchPromise) {
      await cloudDispatchPromise;
    }

    submitBtn.disabled = false;
    submitSpinner.style.display = "none";
    showSuccessState(requestedDateFormatted);
    form.reset();
  });
}

function showSuccessState(dateFormatted) {
  const bookingGrid = document.getElementById("auditBookingGrid");
  const successCard = document.getElementById("auditSuccessState");
  const confirmedDateText = document.getElementById("confirmedDateText");

  if (confirmedDateText) {
    confirmedDateText.textContent = dateFormatted;
  }

  if (bookingGrid) {
    bookingGrid.style.display = "none";
  }

  if (successCard) {
    successCard.style.display = "block";
    successCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
