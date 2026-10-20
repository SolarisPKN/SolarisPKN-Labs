import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/scripts/analytics.js', import.meta.url), 'utf8');
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function harness(savedChoice = null, id = 'G-66ZYMRXVCE') {
  const listeners = new Map();
  const scripts = [];
  const scriptHost = { appendChild: (node) => scripts.push(node) };
  const storage = new Map();
  if (savedChoice) storage.set('solarispkn-labs.analytics-consent.v1', savedChoice);
  const cookies = [];
  const panel = {
    hidden: true, dataset: { gaId: id },
    querySelector: () => ({ focus() {} })
  };
  let reloads = 0;
  const document = {
    readyState: 'complete',
    title: 'Labs',
    addEventListener: (type, cb) => listeners.set(type, cb),
    querySelector: (selector) => selector === '[data-analytics-consent]' ? panel : null,
    getElementById: (id) => id === 'analytics-script-host' ? scriptHost : null,
    createElement: (tag) => ({
      tag,
      setAttribute(name, value) { this[name] = value; }
    }),
    head: { appendChild: (node) => scripts.push(node) },
    set cookie(value) { cookies.push(value); },
    get cookie() { return cookies.at(-1) || ''; }
  };
  const window = {
    localStorage: {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v)
    },
    location: { reload() { reloads++; } }
  };
  runInNewContext(source, { window, document, Date, encodeURIComponent });
  const click = (choiceOrSettings) => {
    const settings = choiceOrSettings === 'settings';
    const button = {
      dataset: settings ? {} : { analyticsChoice: choiceOrSettings },
      matches: (selector) => settings && selector === '[data-analytics-settings]'
    };
    listeners.get('click')({ target: { closest: () => button } });
  };
  return { window, panel, scripts, scriptHost, storage, cookies, click, listeners, reloads: () => reloads };
}

test('new visitor receives no Google tag or cookies until opt-in', () => {
  const site = harness();
  assert.equal(site.panel.hidden, false);
  assert.equal(site.scripts.length, 0);
  assert.equal(site.window.dataLayer, undefined);
  assert.equal(site.cookies.length, 0);
  site.click('rejected');
  assert.equal(site.scripts.length, 0);
  assert.equal(site.panel.hidden, true);
  assert.equal(site.storage.get('solarispkn-labs.analytics-consent.v1'), 'rejected');
});

test('opt-in loads the tag once and does not manually duplicate pageviews', () => {
  const site = harness();
  site.click('accepted');
  assert.equal(site.panel.hidden, true);
  assert.equal(site.scripts.length, 1);
  assert.equal(site.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-66ZYMRXVCE');
  const entries = Array.from(site.window.dataLayer, a => Array.from(a));
  const config = entries.find(a => a[0] === 'config');
  assert.equal(config[1], 'G-66ZYMRXVCE');
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(entries.some(a => a[0] === 'event' && a[1] === 'page_view'), false);
  site.listeners.get('astro:page-load')();
  site.listeners.get('astro:page-load')();
  assert.equal(site.scripts.length, 1);
  assert.equal(site.window.dataLayer.length, entries.length);
});

test('returning consenting visitors load the tag, rejected visitors do not', () => {
  assert.equal(harness('accepted').scripts.length, 1);
  const rejected = harness('rejected');
  assert.equal(rejected.scripts.length, 0);
  assert.equal(rejected.panel.hidden, true);
  rejected.click('settings');
  assert.equal(rejected.panel.hidden, false);
});

test('withdrawal unloads analytics by reloading after deleting first-party GA cookies', () => {
  const site = harness('accepted');
  site.click('settings');
  site.click('rejected');
  assert.equal(site.reloads(), 1);
  assert.equal(site.storage.get('solarispkn-labs.analytics-consent.v1'), 'rejected');
  assert.ok(site.cookies.some(c => c.startsWith('_ga=; Max-Age=0')));
  assert.ok(site.cookies.some(c => c.startsWith('_ga_66ZYMRXVCE=; Max-Age=0')));
});

test('invalid measurement ID never loads a Google script', () => {
  const site = harness(null, 'not-a-real-id');
  site.click('accepted');
  assert.equal(site.scripts.length, 0);
});

test('site-wide bilingual UI, privacy explanation and restrictive CSP', () => {
  const layout = read('src/layouts/Layout.astro');
  const consent = read('src/components/Layout/AnalyticsConsent.astro');
  const privacy = read('src/pages/[lang]/privacy/index.astro');
  const headers = read('public/_headers');
  assert.match(layout, /<AnalyticsConsent lang=\{lang\}/);
  assert.match(layout, /data-analytics-settings/);
  assert.match(consent, /G-66ZYMRXVCE/);
  assert.match(consent, /data-analytics-choice="accepted"/);
  assert.match(consent, /data-analytics-choice="rejected"/);
  assert.match(consent, /analytics-consent\[hidden\]/);
  assert.match(privacy, /getStaticPaths/);
  assert.match(headers, /script-src .*https:\/\/www\.googletagmanager\.com/);
  assert.ok(!read('src/worker.js').includes('G-66ZYMRXVCE'));
});

test('the tag remains in the persisted host when Astro changes /es/ to /en/', () => {
  const site = harness('accepted');
  const tag = site.scripts[0];
  const html = read('src/layouts/Layout.astro');
  assert.match(html, /id="analytics-script-host" transition:persist/);
  assert.ok(tag);
  assert.equal(site.scripts.length, 1);
  // Astro preserves the element and JS globals, then fires astro:page-load.
  site.panel.dataset.gaId = 'G-66ZYMRXVCE';
  site.listeners.get('astro:page-load')();
  assert.strictEqual(site.scripts[0], tag);
  assert.equal(site.scripts.length, 1);
  assert.equal(site.window.dataLayer.filter((a) => a[0] === 'config').length, 1);

  for (const path of [
    'src/pages/[lang]/index.astro',
    'src/pages/[lang]/portfolio.astro',
    'src/pages/[lang]/blog/index.astro',
    'src/pages/[lang]/gaming/index.astro',
    'src/pages/[lang]/projects/[slug].astro'
  ]) {
    assert.match(read(path), /<Layout\b/);
  }
});
