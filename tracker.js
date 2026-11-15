/**
 * NORTHEX PERFORMANCE MARKETING - FIRST-PARTY TRACKER & ATTRIBUTION ENGINE
 * 
 * Captures first-party cookies, campaign attribution (UTMs, Meta fbclid, Google gclid),
 * visitor journey, device telemetry, and GDPR-compliant consent management.
 */

(function () {
  "use strict";

  const COOKIE_DOMAIN = window.location.hostname === "localhost" ? "" : "";
  const IS_SECURE = window.location.protocol === "https:";
  const CONSENT_COOKIE = "nx_consent";
  const VID_COOKIE = "nx_vid";
  const SID_COOKIE = "nx_sid";
  const UTM_COOKIE = "nx_utm";
  const META_COOKIE = "nx_meta";

  // Cookie Utilities
  function setCookie(name, value, days) {
    try {
      let expires = "";
      if (days) {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + d.toUTCString();
      }
      const secureFlag = IS_SECURE ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax${secureFlag}`;
      try { localStorage.setItem(name, value); } catch (_) {}
    } catch (e) {
      console.warn("[Northex Tracker] Cookie set error:", e);
    }
  }

  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
      if (match) return decodeURIComponent(match[3]);
      try {
        const local = localStorage.getItem(name);
        if (local) return local;
      } catch (_) {}
    } catch (_) {}
    return null;
  }

  function generateUUID(prefix = "nx") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Device & Environment Telemetry
  function detectDevice() {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /(iPad|Tablet|(Android(?!.*Mobile)))/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    if (isTablet) return "Tablet";
    if (isMobile) return "Mobile";
    return "Desktop";
  }

  function detectOS() {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
    if (/Windows NT/.test(ua)) return "Windows";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown OS";
  }

  function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "Edge";
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    if (/Firefox\//.test(ua)) return "Firefox";
    return "Browser";
  }

  // Parse URL Parameters
  function getUrlParams() {
    const params = {};
    const search = window.location.search;
    if (!search) return params;
    try {
      if (typeof URLSearchParams !== "undefined") {
        const urlParams = new URLSearchParams(search);
        for (const [key, val] of urlParams.entries()) {
          params[key.toLowerCase()] = val;
        }
        return params;
      }
    } catch (_) {}
    try {
      search.replace(/^\?/, "").split("&").forEach(pair => {
        const [k, v] = pair.split("=");
        if (k) params[decodeURIComponent(k).toLowerCase()] = decodeURIComponent(v || "");
      });
    } catch (_) {}
    return params;
  }

  // Initialize Tracker State
  let visitorId = getCookie(VID_COOKIE);
  if (!visitorId) {
    visitorId = generateUUID("nx_v");
    setCookie(VID_COOKIE, visitorId, 365);
  }

  let sessionId = getCookie(SID_COOKIE);
  let isNewSession = false;
  if (!sessionId) {
    sessionId = generateUUID("nx_s");
    setCookie(SID_COOKIE, sessionId, 0.021); // ~30 minutes
    isNewSession = true;
  }

  // Visit Count & History
  let visitCount = parseInt(getCookie("nx_vcount") || "0", 10);
  if (isNewSession) {
    visitCount += 1;
    setCookie("nx_vcount", visitCount.toString(), 365);
  }

  let firstSeen = getCookie("nx_first_seen");
  if (!firstSeen) {
    firstSeen = new Date().toISOString();
    setCookie("nx_first_seen", firstSeen, 365);
  }
  setCookie("nx_last_seen", new Date().toISOString(), 365);

  // Marketing & Attribution Processing
  const urlParams = getUrlParams();
  let existingUtm = {};
  try {
    const rawUtm = getCookie(UTM_COOKIE);
    if (rawUtm) existingUtm = JSON.parse(rawUtm);
  } catch (_) {}

  const hasNewAttribution = 
    urlParams.utm_source || 
    urlParams.utm_campaign || 
    urlParams.fbclid || 
    urlParams.gclid || 
    urlParams.wbraid || 
    urlParams.gbraid || 
    urlParams.ttclid;

  let currentUtm = existingUtm;

  if (hasNewAttribution || Object.keys(existingUtm).length === 0) {
    currentUtm = {
      utmSource: urlParams.utm_source || (document.referrer ? new URL(document.referrer, location.href).hostname : "direct"),
      utmMedium: urlParams.utm_medium || (urlParams.fbclid ? "paid_social" : (urlParams.gclid ? "paid_search" : "organic")),
      utmCampaign: urlParams.utm_campaign || "none",
      utmTerm: urlParams.utm_term || "",
      utmContent: urlParams.utm_content || "",
      adClickId: urlParams.fbclid || urlParams.gclid || urlParams.wbraid || urlParams.gbraid || urlParams.ttclid || "",
      adPlatform: urlParams.fbclid ? "Meta Ads (Instagram/FB)" : (urlParams.gclid || urlParams.wbraid || urlParams.gbraid ? "Google Ads" : (urlParams.ttclid ? "TikTok Ads" : "Direct/Organic")),
      initialLanding: window.location.href,
      referrer: document.referrer || "direct",
      capturedAt: new Date().toISOString()
    };
    setCookie(UTM_COOKIE, JSON.stringify(currentUtm), 90);
  }

  // Device context
  const device = detectDevice();
  const os = detectOS();
  const browser = detectBrowser();
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || "en";
  let timezone = "UTC";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (_) {}

  // Public Tracker API
  window.NorthexTracker = {
    getAttribution: function () {
      return {
        visitorId: visitorId,
        sessionId: sessionId,
        visitCount: visitCount,
        firstSeen: firstSeen,
        lastSeen: new Date().toISOString(),
        landingPage: currentUtm.initialLanding || window.location.href,
        referrer: currentUtm.referrer || document.referrer || "direct",
        utmSource: currentUtm.utmSource || "direct",
        utmMedium: currentUtm.utmMedium || "direct",
        utmCampaign: currentUtm.utmCampaign || "none",
        utmContent: currentUtm.utmContent || "",
        utmTerm: currentUtm.utmTerm || "",
        adClickId: currentUtm.adClickId || "",
        adPlatform: currentUtm.adPlatform || "Direct",
        deviceType: device,
        os: os,
        browser: browser,
        screen: screenRes,
        language: language,
        timezone: timezone,
        consent: getCookie(CONSENT_COOKIE) || "not_prompted"
      };
    },

    setConsent: function (status) {
      setCookie(CONSENT_COOKIE, status, 180);
      const banner = document.getElementById("nxCookieBanner");
      if (banner) {
        banner.classList.add("nx-cookie-hidden");
        setTimeout(() => { banner.remove(); }, 400);
      }
    },

    initConsentBanner: function () {
      const consent = getCookie(CONSENT_COOKIE);
      if (consent) return; // User already made a choice

      // Create and inject consent banner
      const banner = document.createElement("div");
      banner.id = "nxCookieBanner";
      banner.className = "nx-cookie-banner";
      banner.innerHTML = `
        <div class="nx-cookie-inner">
          <div class="nx-cookie-badge">
            <span class="nx-cookie-dot"></span>
            <span>Privacy &amp; Performance</span>
          </div>
          <div class="nx-cookie-body">
            <h4>First-Party Cookie Consent</h4>
            <p>We use first-party cookies to attribute ad campaigns, measure site performance, and remember your preferences. No third-party data broker selling.</p>
          </div>
          <div class="nx-cookie-actions">
            <button type="button" class="btn pri btn-primary nx-cookie-btn-accept" id="nxCookieAcceptBtn">Accept All</button>
            <button type="button" class="btn sec btn-outline nx-cookie-btn-decline" id="nxCookieEssentialBtn">Essential Only</button>
          </div>
        </div>
      `;

      document.body.appendChild(banner);

      // Event Listeners
      const acceptBtn = document.getElementById("nxCookieAcceptBtn");
      const essentialBtn = document.getElementById("nxCookieEssentialBtn");

      if (acceptBtn) {
        acceptBtn.addEventListener("click", () => {
          window.NorthexTracker.setConsent("granted");
        });
      }
      if (essentialBtn) {
        essentialBtn.addEventListener("click", () => {
          window.NorthexTracker.setConsent("essential");
        });
      }
    }
  };

  // Run Consent Banner after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.NorthexTracker.initConsentBanner();
    });
  } else {
    window.NorthexTracker.initConsentBanner();
  }
})();
