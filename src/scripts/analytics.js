// GA4: basic opt-in consent, no tracking or Google network requests before approval.
// This module is loaded once and survives Astro ClientRouter page transitions.
(() => {
  if (window.__solarispknAnalyticsInitialized) return;
  window.__solarispknAnalyticsInitialized = true;

  const CONSENT_KEY = 'solarispkn-labs.analytics-consent.v1';
  let memoryChoice = null;
  let googleTagStarted = false;
  let lastTrackedPage = null;

  function consentChoice() {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === 'accepted' || stored === 'rejected') return stored;
    } catch { /* Browser storage is optional. */ }
    return memoryChoice;
  }

  function saveChoice(choice) {
    memoryChoice = choice;
    try { window.localStorage.setItem(CONSENT_KEY, choice); }
    catch { /* Keep the in-memory choice for the current visit. */ }
  }

  function measurementId() {
    const id = document.querySelector('[data-analytics-consent]')?.dataset.gaId ?? '';
    return /^G-[A-Z0-9]+$/.test(id) ? id : null;
  }

  function startGoogleAnalytics(id) {
    if (googleTagStarted) return;
    googleTagStarted = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    // Even after opting in to statistics, advertising consent remains denied.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const googleScript = document.createElement('script');
    googleScript.async = true;
    googleScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    googleScript.setAttribute('data-ga4-tag', '');
    document.head.appendChild(googleScript);
  }

  function recordPageView() {
    if (consentChoice() !== 'accepted' || !googleTagStarted || !window.gtag) return;

    // Deliberately omit query strings and URL fragments; they may contain private data.
    const page = window.location.origin + window.location.pathname;
    if (lastTrackedPage === page) return;
    lastTrackedPage = page;
    window.gtag('event', 'page_view', {
      page_location: page,
      page_title: document.title,
      page_path: window.location.pathname
    });
  }

  function renderConsent() {
    const panel = document.querySelector('[data-analytics-consent]');
    if (!panel) return;
    const choice = consentChoice();
    panel.hidden = choice !== null;
    if (choice === 'accepted') {
      const id = measurementId();
      if (id) {
        startGoogleAnalytics(id);
        recordPageView();
      }
    }
  }

  function expireAnalyticsCookies() {
    // Limit deletion to the two first-party cookies used by this GA4 property.
    const id = measurementId();
    const cookieNames = ['_ga'];
    if (id) cookieNames.push('_ga_' + id.slice(2));
    for (const name of cookieNames) {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
    }
  }

  function handleClick(event) {
    const target = event.target?.closest?.('[data-analytics-choice],[data-analytics-settings]');
    if (!target) return;
    if (target.matches('[data-analytics-settings]')) {
      const panel = document.querySelector('[data-analytics-consent]');
      if (panel) {
        panel.hidden = false;
        panel.querySelector('[data-analytics-choice]')?.focus();
      }
      return;
    }
    const choice = target.dataset.analyticsChoice;
    if (choice === 'close') {
      const panel = document.querySelector('[data-analytics-consent]');
      if (panel && consentChoice() !== null) panel.hidden = true;
      return;
    }
    if (choice !== 'accepted' && choice !== 'rejected') return;

    const previouslyActive = googleTagStarted;
    saveChoice(choice);
    const panel = document.querySelector('[data-analytics-consent]');
    if (panel) panel.hidden = true;

    if (choice === 'accepted') {
      const id = measurementId();
      if (id) {
        startGoogleAnalytics(id);
        recordPageView();
      }
    } else if (previouslyActive) {
      // Basic consent mode: unload the Google tag entirely on withdrawal.
      expireAnalyticsCookies();
      window.location.reload();
    }
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('astro:page-load', renderConsent);

  // Direct loads work whether this bundle ran before or after DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderConsent, { once: true });
  } else {
    renderConsent();
  }
})();
