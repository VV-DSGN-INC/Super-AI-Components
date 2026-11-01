#!/usr/bin/env node
// unslop's render tier: the Phase 2 passes that used to be eyeballed, measured
// in a real browser. Headless Chrome over the DevTools protocol, driven with
// Node's built-in WebSocket (Node 22+), so there is nothing to install beyond
// Chrome itself. CHROME_PATH overrides the binary.
//
//   node render.mjs <url|file ...> [--widths 375,1280] [--scheme light|dark]
//                   [--shots <dir>] [--allow-move <sel,...>]
//                   [--allow-motion <sel,...>] [--max-controls 80] [--json]
//                   [--storage <key=value> ...] [--height <px>]
//                   [--no-route-expansion]
//   node render.mjs --selftest
//
// --height fixes the viewport height for every width in the run (a 1080x1080
// kiosk, a 1920x1080 fold); without it a phone width gets 812 and the rest 800.
//
// --storage seeds localStorage before the page's own scripts run, so an app
// whose theme, night mode or demo state lives in a persisted store can be put
// into that state for the run: --storage 'kiosk:local-overrides={"state":{"night":{"value":true,"base":false}},"version":0}'
//
// Checks, each named in the report and mapped to a Phase 1 area:
//   overflow      horizontal scroll, or an element spilling past the screen   (Responsive)
//   no-focus      a control whose computed style ignores :focus-visible       (States & a11y)
//   state-moves   a forced :hover / :focus on a control moved or resized any  (Layout: state stability)
//                 visible box, the control's own included
//   motion-rest   an animation still running on the idle page               (Motion)
//   contrast      text under 4.5:1 (3:1 large) against the pixels behind it  (States & a11y)
//                 (candidates come from computed style, the verdict from a
//                 screenshot of the strip behind the glyphs, so a surface
//                 painted by a pseudo-element, an absolute layer or an image
//                 is read as the eye sees it)
//   tap-target    an interactive element under 24px on a phone width         (Responsive)
//   tiny-text     text set under 12px                                         (Type: readable text)
//   measure       running text over 80ch a line, or justified (WARN)          (Type: readable text)
//   leading       running text with line-height under 1.35 (WARN)             (Type: readable text)
//   edge          text within 16px of the screen edge on a phone (WARN)       (Layout: breathing room)
//   headings      a skipped heading level, a heading no bigger or heavier     (Type: readable text)
//                 than body text, or two adjacent levels set alike
//   broken-image  an <img> that finished loading with nothing to show         (States & a11y)
//   script-error  an uncaught exception while the page loads                 (States & a11y)
//
// WARN marks a Reflex rule: reported, waivable, and it does not fail the run.
//
// A check that has not caught its planted positive proves nothing: --selftest
// runs the slop and clean fixtures in ../fixtures/render and fails unless
// every check fires on slop and none on clean.

import { spawn } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { inflateSync } from "node:zlib"
import { findRepoRoot, loadConfig, applyRenderConfig, expandRoutes } from "./config.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = resolve(HERE, "../fixtures/render")

// ---------------------------------------------------------------- arguments

const opts = {
  targets: [],
  widths: [375, 1280],
  scheme: "light",
  shots: null,
  allowMove: [],
  allowMotion: ['[role="progressbar"]', "[aria-busy='true']", ".skeleton", "[data-loading]"],
  maxControls: 80,
  json: false,
  selftest: false,
  storage: [],
  height: null,
  noRouteExpansion: false,
}
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  const next = () => argv[++i] ?? usage(`${a} needs a value`)
  if (a === "--widths") opts.widths = next().split(",").map((w) => parseInt(w, 10)).filter(Boolean)
  else if (a === "--scheme") opts.scheme = next()
  else if (a === "--shots") opts.shots = resolve(next())
  else if (a === "--allow-move") opts.allowMove.push(...next().split(","))
  else if (a === "--allow-motion") opts.allowMotion.push(...next().split(","))
  else if (a === "--max-controls") opts.maxControls = parseInt(next(), 10)
  else if (a === "--storage") { const v = next(); const eq = v.indexOf("="); if (eq < 1) usage("--storage takes key=value"); opts.storage.push([v.slice(0, eq), v.slice(eq + 1)]) }
  else if (a === "--height") { opts.height = parseInt(next(), 10); if (!(opts.height > 0)) usage("--height takes a pixel count") }
  else if (a === "--json") opts.json = true
  else if (a === "--selftest") opts.selftest = true
  else if (a === "--no-route-expansion") opts.noRouteExpansion = true
  else if (a === "--help" || a === "-h") usage()
  else if (a.startsWith("--")) usage(`unknown flag ${a}`)
  else opts.targets.push(a)
}
// Config fills in only what the flags left unset: unslop.config.json at the
// repo root (found by walking up from the cwd). The selftest ignores it.
if (!opts.selftest) {
  try {
    const root = findRepoRoot()
    if (existsSync(join(root, "unslop.config.json"))) applyRenderConfig(opts, loadConfig(root), new Set(argv))
  } catch (e) {
    console.error(`render.mjs: ${e.message}`)
    process.exit(2)
  }
}
if (!["light", "dark"].includes(opts.scheme)) usage("--scheme is light or dark")
if (!opts.selftest && opts.targets.length === 0) usage()

function usage(err) {
  if (err) console.error(`render.mjs: ${err}`)
  console.error("usage: node render.mjs <url|file ...> [--widths 375,1280] [--scheme light|dark] [--shots <dir>] [--allow-move <sel,...>] [--allow-motion <sel,...>] [--max-controls 80] [--storage key=value ...] [--height px] [--no-route-expansion] [--json]")
  console.error("       node render.mjs --selftest")
  process.exit(2)
}

function toUrl(t) {
  if (/^https?:\/\//.test(t) || t.startsWith("data:")) return t
  const p = resolve(t)
  if (!existsSync(p)) usage(`no such file: ${t}`)
  return pathToFileURL(p).href
}

// ------------------------------------------------------------------- chrome

// The hook stops a slow render with SIGTERM: close Chrome and its temp profile
// first, then exit 124 so the caller can tell a timeout from a failure.
let cleanup = null
process.on("SIGTERM", () => {
  try { cleanup?.() } catch {}
  process.exit(124)
})

const CHROMES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean)

async function launch() {
  const bin = CHROMES.find((p) => existsSync(p))
  if (!bin) throw new Error("no Chrome found; set CHROME_PATH")
  const profile = mkdtempSync(join(tmpdir(), "unslop-render-"))
  const close = () => { try { proc.kill() } catch {} ; try { rmSync(profile, { recursive: true, force: true }) } catch {} }
  cleanup = close
  const proc = spawn(bin, [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--hide-scrollbars",
    "--disable-extensions", "--mute-audio", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] })
  const wsUrl = await new Promise((res, rej) => {
    let buf = ""
    proc.stderr.on("data", (d) => { buf += d; const m = buf.match(/ws:\/\/\S+/); if (m) res(m[0]) })
    proc.on("exit", (c) => rej(new Error(`chrome exited (${c}) before listening:\n${buf}`)))
    setTimeout(() => rej(new Error(`chrome did not start listening:\n${buf}`)), 10000)
  })
  const http = wsUrl.replace(/^ws/, "http").replace(/\/devtools\/browser\/.*$/, "")
  const pages = await (await fetch(`${http}/json/list`)).json()
  const page = pages.find((t) => t.type === "page")
  const cdp = new CDP(page.webSocketDebuggerUrl)
  await cdp.ready
  return { cdp, close }
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.id = 0
    this.pending = new Map()
    this.listeners = new Map()
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = () => rej(new Error("devtools websocket failed")) })
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id) {
        const p = this.pending.get(m.id)
        if (!p) return
        this.pending.delete(m.id)
        m.error ? p.reject(new Error(`${p.method}: ${m.error.message}`)) : p.resolve(m.result)
      } else if (m.method) {
        for (const f of this.listeners.get(m.method) ?? []) f(m.params)
      }
    }
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id
      this.pending.set(id, { resolve, reject, method })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  /** Calls `f` with every event's params until the returned function is called. */
  on(method, f) {
    const list = this.listeners.get(method) ?? this.listeners.set(method, []).get(method)
    list.push(f)
    return () => this.listeners.set(method, (this.listeners.get(method) ?? []).filter((x) => x !== f))
  }
  /** Resolves with the next event's params, or null after `ms`. */
  once(method, ms) {
    return new Promise((res) => {
      const list = this.listeners.get(method) ?? this.listeners.set(method, []).get(method)
      const off = () => this.listeners.set(method, (this.listeners.get(method) ?? []).filter((x) => x !== f))
      const t = setTimeout(() => { off(); res(null) }, ms)
      const f = (p) => { clearTimeout(t); off(); res(p) }
      list.push(f)
    })
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ------------------------------------------------------------ page helpers
// Everything in PAGE runs inside the page. It is a string so the file stays
// dependency-free; keep it plain ES2020.

const PAGE = String.raw`(() => {
  const U = (window.__unslop = {});
  const INTERACTIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=switch]';
  const vis = (e) => {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  };
  U.describe = (e) => {
    const t = e.tagName.toLowerCase();
    const id = e.id ? '#' + e.id : '';
    const cls = typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const txt = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    return t + id + cls + (txt ? ' "' + txt + '"' : '');
  };
  const matchesAny = (e, sels) => sels.some((s) => { try { return e.closest(s); } catch { return false; } });

  // Tag every visible element once so snapshots line up by index.
  U.tag = (allowMove) => {
    let n = 0;
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('svg') && e.tagName !== 'svg') continue;
      if (!vis(e)) continue;
      e.setAttribute('data-unslop-r', String(n++));
      if (n >= 3000) break;
    }
    let c = 0;
    const controls = [];
    for (const e of document.querySelectorAll(INTERACTIVE)) {
      if (!vis(e)) continue;
      const disclosure = e.hasAttribute('aria-expanded') || e.hasAttribute('aria-haspopup') || e.tagName === 'SUMMARY' || matchesAny(e, allowMove);
      e.setAttribute('data-unslop-c', String(c));
      controls.push({ i: c, sel: '[data-unslop-c="' + c + '"]', desc: U.describe(e), disclosure });
      c++;
    }
    return { tagged: n, controls };
  };
  U.rects = () => Array.from(document.querySelectorAll('[data-unslop-r]')).map((e) => {
    const r = e.getBoundingClientRect();
    return [Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
  });
  U.describeIndex = (i) => { const e = document.querySelector('[data-unslop-r="' + i + '"]'); return e ? U.describe(e) : '#' + i; };
  U.focusSignature = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    // An outline with style none is invisible whatever its width, colour or
    // offset, and the UA sheet nudges outline-offset under :focus-visible on
    // links, so those fields count only when the outline is drawn.
    const outline = (cs) => (cs.outlineStyle === 'none' || cs.outlineWidth === '0px') ? 'outline:none' : [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset].join(' ');
    const pick = (cs) => [outline(cs), cs.boxShadow, cs.borderTopColor, cs.borderBottomColor, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.opacity, cs.transform].join('|');
    return [pick(getComputedStyle(e)), pick(getComputedStyle(e, '::before')), pick(getComputedStyle(e, '::after')), e.parentElement ? pick(getComputedStyle(e.parentElement)) : ''].join('~');
  };
  U.overflow = () => {
    const out = [];
    const vw = innerWidth;
    if (document.documentElement.scrollWidth > vw + 1) out.push({ kind: 'scroll', evidence: 'scrollWidth ' + document.documentElement.scrollWidth + ' > viewport ' + vw });
    const clipped = (el) => { for (let q = el.parentElement; q && q !== document.documentElement; q = q.parentElement) { const cs = getComputedStyle(q); if (/hidden|clip|auto|scroll/.test(cs.overflowX + ' ' + cs.overflow)) return true; } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el) || getComputedStyle(el).position === 'fixed' || el.closest('svg') || clipped(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2 || r.left < -2) { out.push({ kind: 'spill', evidence: U.describe(el) + ' runs ' + Math.round(Math.max(r.right - vw, -r.left)) + 'px past the ' + vw + 'px screen' }); break; }
    }
    return out;
  };
  U.animationsAtRest = (allow) => {
    const out = [];
    for (const a of document.getAnimations()) {
      if (a.playState !== 'running') continue;
      const el = a.effect && a.effect.target;
      if (!el || !(el instanceof Element) || matchesAny(el, allow)) continue;
      const t = a.effect.getTiming();
      const name = a.animationName || (a.transitionProperty ? 'transition ' + a.transitionProperty : 'animation');
      out.push({ evidence: U.describe(el) + ' runs "' + name + '" on the idle page (' + (t.iterations === Infinity ? 'infinite' : t.iterations + '×') + ', ' + t.duration + 'ms)' });
      if (out.length >= 15) break;
    }
    return out;
  };
  // Computed colours arrive as rgb(a)(...) or, past sRGB or with modern syntax,
  // as color(srgb r g b / a) with 0..1 channels. Anything else is unknown.
  const rgb = (s) => {
    s = s || '';
    const m = s.match(/-?[\d.]+(?:e-?\d+)?/g); if (!m) return null;
    if (/^color\(srgb/.test(s)) { const [r, g, b, a = 1] = m.map(Number); return [r * 255, g * 255, b * 255, a]; }
    if (!/^rgba?\(/.test(s)) return null;
    const [r, g, b, a = 1] = m.map(Number); return [r, g, b, a];
  };
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const blend = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => Math.round(top[i] * a + under[i] * (1 - a))).concat([1]); };
  // Candidates only: the computed walk up the ancestors is cheap but wrong
  // whenever the surface is painted by something that is not an ancestor (a
  // pseudo-element, an absolute layer, an image), so the script confirms every
  // candidate against the pixels behind the text before it reports one.
  U.contrast = () => {
    const out = []; const seen = new Set(); let t = 0;
    const root = rgb(getComputedStyle(document.body).backgroundColor);
    const page = root && root[3] > 0 ? root : [255, 255, 255, 1];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg,script,style') || !vis(el)) continue;
      const text = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (text.length < 2) continue;
      const cs = getComputedStyle(el);
      let fg = rgb(cs.color); if (!fg) continue;
      let bg = null, layers = [], image = false;
      for (let q = el; q && q !== document.documentElement; q = q.parentElement) {
        const qs = getComputedStyle(q);
        if (qs.backgroundImage && qs.backgroundImage !== 'none') { image = true; break; }
        const c = rgb(qs.backgroundColor);
        if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) { bg = c; break; } }
      }
      if (!bg) bg = page;
      for (let i = layers.length - 1; i >= 0; i--) if (layers[i][3] < 0.99) bg = blend(layers[i], bg);
      if (fg[3] < 0.99) fg = blend(fg, bg);
      const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const r = image ? 0 : ratio(fg, bg);
      if (image || r < need - 0.05) {
        const key = cs.color + '|' + (image ? 'image' : bg.join(',')) + '|' + el.tagName + '|' + el.className;
        if (seen.has(key)) continue; seen.add(key);
        el.setAttribute('data-unslop-t', String(t));
        out.push({ t: t++, desc: U.describe(el), color: cs.color, fg: fg.slice(0, 3), need, computed: image ? null : r });
        if (out.length >= 25) break;
      }
    }
    return out;
  };
  // Paint the candidate with its glyphs transparent and return the page-space
  // strip behind the text's centre, for a screenshot clip.
  U.hideText = (t) => {
    const el = document.querySelector('[data-unslop-t="' + t + '"]'); if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.__unslopStyle = el.getAttribute('style');
    for (const p of ['color', '-webkit-text-fill-color', 'text-decoration-color']) el.style.setProperty(p, 'transparent', 'important');
    el.style.setProperty('text-shadow', 'none', 'important');
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const w = Math.max(2, Math.min(24, Math.floor(r.width))), h = Math.max(2, Math.min(10, Math.floor(r.height)));
    return { x: Math.round(r.x + scrollX + (r.width - w) / 2), y: Math.round(r.y + scrollY + (r.height - h) / 2), width: w, height: h };
  };
  U.showText = (t) => {
    const el = document.querySelector('[data-unslop-t="' + t + '"]'); if (!el) return;
    if (el.__unslopStyle === null) el.removeAttribute('style'); else el.setAttribute('style', el.__unslopStyle);
  };
  U.tapTargets = () => {
    const out = [];
    for (const e of document.querySelectorAll(INTERACTIVE)) {
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) { out.push({ evidence: U.describe(e) + ' is ' + Math.round(r.width) + '×' + Math.round(r.height) + 'px' }); if (out.length >= 15) break; }
    }
    return out;
  };
  // Text the element sets itself, not text it inherits from a child.
  const ownText = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim());
  const canvas = document.createElement('canvas').getContext('2d');
  const chWidth = (cs) => { canvas.font = [cs.fontStyle, cs.fontWeight, cs.fontSize, cs.fontFamily].join(' '); return canvas.measureText('0').width || parseFloat(cs.fontSize) / 2; };
  const lineHeight = (cs) => cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
  U.text = (edgeCheck) => {
    const out = [];
    const vw = innerWidth;
    const count = {};
    const add = (check, grade, evidence) => { count[check] = (count[check] || 0) + 1; if (count[check] <= 10) out.push({ check, grade, evidence }); };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg,script,style,code,pre,kbd,samp,sup,sub,[aria-hidden="true"]') || !vis(el)) continue;
      const nodes = ownText(el);
      const text = nodes.map((n) => n.textContent).join('').trim();
      if (text.length < 2) continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize), lh = lineHeight(cs);
      // Lines and line width come from the glyph boxes, not the element box:
      // a 44px button holding one word is one line.
      const range = document.createRange(), tops = new Set();
      let widest = 0;
      for (const n of nodes) { range.selectNodeContents(n); for (const q of range.getClientRects()) if (q.width > 0) { tops.add(Math.round(q.top)); widest = Math.max(widest, q.width); } }
      const lines = tops.size;
      if (fs < 11.5) add('tiny-text', 'FAIL', U.describe(el) + ' is set at ' + fs + 'px');
      if (lines >= 2 && fs <= 20) {
        const ch = Math.round(widest / chWidth(cs));
        if (ch > 80) add('measure', 'WARN', U.describe(el) + ' runs about ' + ch + 'ch per line over ' + lines + ' lines');
        if (cs.textAlign === 'justify') add('measure', 'WARN', U.describe(el) + ' is justified running text');
      }
      if (lines >= 3 && fs <= 20 && lh / fs < 1.35) add('leading', 'WARN', U.describe(el) + ' has leading ' + (lh / fs).toFixed(2) + ' (' + Math.round(lh) + 'px on ' + fs + 'px) over ' + lines + ' lines');
      if (edgeCheck) {
        for (const n of nodes) {
          range.selectNodeContents(n);
          const hit = Array.from(range.getClientRects()).find((q) => q.width > 0 && (q.left < 15.5 || q.right > vw - 15.5));
          if (hit) { add('edge', 'WARN', U.describe(el) + ' text sits ' + Math.round(Math.min(hit.left, vw - hit.right)) + 'px from the edge of the ' + vw + 'px screen'); break; }
        }
      }
    }
    return out;
  };
  U.headings = () => {
    const out = [];
    const hs = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading][aria-level]')).filter(vis);
    const level = (h) => /^H[1-6]$/.test(h.tagName) ? +h.tagName[1] : +h.getAttribute('aria-level');
    const ps = Array.from(document.querySelectorAll('p')).filter(vis).map((p) => getComputedStyle(p));
    const body = ps.length ? ps[Math.floor(ps.length / 2)] : getComputedStyle(document.body);
    const bodyFs = parseFloat(body.fontSize), bodyW = parseInt(body.fontWeight, 10) || 400;
    const firstOf = {};
    for (let i = 0; i < hs.length; i++) {
      const h = hs[i], l = level(h), cs = getComputedStyle(h);
      const fs = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10) || 400;
      if (i > 0 && l > level(hs[i - 1]) + 1) out.push({ evidence: U.describe(hs[i - 1]) + ' (h' + level(hs[i - 1]) + ') is followed by ' + U.describe(h) + ' (h' + l + '); a level is skipped' });
      if (fs <= bodyFs + 0.5 && w <= bodyW) out.push({ evidence: U.describe(h) + ' (h' + l + ', ' + fs + 'px ' + w + ') is no larger or heavier than body text (' + bodyFs + 'px ' + bodyW + ')' });
      if (!firstOf[l]) firstOf[l] = { fs, w, desc: U.describe(h) };
    }
    for (let l = 1; l < 6; l++) {
      const a = firstOf[l], b = firstOf[l + 1];
      if (a && b && Math.abs(a.fs - b.fs) < 0.5 && a.w === b.w) out.push({ evidence: 'h' + l + ' ' + a.desc + ' and h' + (l + 1) + ' ' + b.desc + ' share ' + a.fs + 'px ' + a.w + '; the scale is flat' });
    }
    return out.slice(0, 10);
  };
  U.brokenImages = () => Array.from(document.images).filter((i) => i.complete && i.getAttribute('src') && i.naturalWidth === 0).slice(0, 10).map((i) => ({ evidence: 'img "' + (i.getAttribute('alt') || '') + '" ' + i.getAttribute('src').slice(0, 60) + ' did not load' }));
  return true;
})()`

// ---------------------------------------------------------------- the run

const FIX = {
  overflow: "overflow-x: clip on html and body is a bandage; find the block, stack it or cap it (mobile-first bases, minmax(0,1fr) tracks, no fixed widths)",
  "no-focus": "give it a :focus-visible ring from the project's focus token; never remove an outline without putting one back",
  "state-moves": "reserve the space at rest (invisible / opacity-0, the same border in transparent); put the signal on colour, shadow, ring or opacity, never padding, size, border-width or type",
  "motion-rest": "bind it to a real state change or render it static; a loader is sanctioned only where Phase 0 says so (--allow-motion)",
  contrast: "move UP the text ramp or lighten the surface; never a one-off darker hex",
  "tap-target": "pad the hit area to 24px (44px in sticky bars) without changing the look: a ::before with inset: -12px",
  "tiny-text": "move it up to the type scale's smallest step, 12px or more; a fact too minor to read at 12px is cut",
  measure: "cap the text block with max-width in ch (65-75); align running text left, never justify",
  leading: "take line-height from the type scale, 1.4 or more for running text",
  headings: "re-level headings to the page outline; each level one scale step or one weight step from the next and above body text",
  edge: "gutter from the spacing scale, 16px or more at 375; a full-bleed band pads its text inside",
  "broken-image": "fix the path; an image that may be missing gets a sized placeholder and alt text",
  "script-error": "fix the error; a page that throws on load is not done, whatever it looks like",
}

async function runTarget(cdp, url, width, state) {
  const findings = []
  const push = (check, grade, evidence) => findings.push({ check, grade, width, target: url, evidence, fix: FIX[check] })

  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: opts.height ?? (width < 768 ? 812 : 800), deviceScaleFactor: 1, mobile: false })
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: opts.scheme }] })
  const errors = []
  const offErrors = cdp.on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails?.exception?.description?.split("\n")[0] ?? p.exceptionDetails?.text ?? "uncaught exception"))
  const loaded = cdp.once("Page.loadEventFired", 20000)
  await cdp.send("Page.navigate", { url })
  if ((await loaded) === null) push("overflow", "WARN", "page did not fire load within 20s; findings below are from a partial render")
  await sleep(700)
  offErrors()
  for (const e of errors.slice(0, 5)) push("script-error", "FAIL", e)

  const ev = async (expr) => {
    const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(`in page: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ""}`)
    return r.result.value
  }
  await ev(PAGE)
  const J = (v) => JSON.stringify(v)
  // What the page says it is, so a run under the wrong theme or mode is
  // visible in the report instead of silently passing.
  const mode = await ev("JSON.stringify({ title: document.title, cls: document.documentElement.className, dataTheme: document.documentElement.getAttribute('data-theme'), filter: getComputedStyle(document.documentElement).filter })")
  findings.push({ check: "page", grade: "NOTE", width, target: url, evidence: describeMode(JSON.parse(mode)), fix: "" })

  // overflow
  for (const o of await ev("__unslop.overflow()")) push("overflow", "FAIL", o.evidence)

  // motion at rest: sample now and again after a beat, so a finite entrance that
  // is still finishing at 700ms does not count but a loop does.
  const first = await ev(`__unslop.animationsAtRest(${J(opts.allowMotion)})`)
  if (first.length) {
    await sleep(1200)
    const again = await ev(`__unslop.animationsAtRest(${J(opts.allowMotion)})`)
    const stillRunning = again.filter((a) => first.some((f) => f.evidence === a.evidence))
    for (const a of stillRunning) push("motion-rest", "FAIL", a.evidence)
  }

  // contrast: every candidate is confirmed against the pixels behind its text
  for (const c of await ev("__unslop.contrast()")) {
    const strip = await ev(`__unslop.hideText(${c.t})`)
    if (!strip) { if (c.computed !== null) push("contrast", "FAIL", `${c.desc} ${c.computed.toFixed(2)}:1 by computed style (needs ${c.need}:1); too small to sample`); continue }
    let px
    try { px = decodePng(Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...strip, scale: 1 } })).data, "base64")).px } catch (e) { px = null }
    await ev(`__unslop.showText(${c.t})`)
    if (!px || !px.length) { if (c.computed !== null) push("contrast", "WARN", `${c.desc} ${c.computed.toFixed(2)}:1 by computed style (needs ${c.need}:1); the pixel read failed`); continue }
    const ratios = px.map((p) => wcagRatio(c.fg, p))
    const best = Math.max(...ratios), worst = Math.min(...ratios)
    if (best < c.need - 0.05) push("contrast", "FAIL", `${c.desc} ${best.toFixed(2)}:1 at best (needs ${c.need}:1): ${c.color} over the pixels behind it`)
    else if (worst < c.need - 0.05) push("contrast", "WARN", `${c.desc} drops to ${worst.toFixed(2)}:1 (needs ${c.need}:1) where the surface behind it is lightest or darkest`)
  }
  await ev("scrollTo(0, 0); true")

  // tap targets on phone widths
  if (width < 768) for (const t of await ev("__unslop.tapTargets()")) push("tap-target", "FAIL", t.evidence)

  // readable text: size, measure, leading, the screen edge on phone widths, heading outline
  for (const t of await ev(`__unslop.text(${width < 768})`)) push(t.check, t.grade, t.evidence)
  for (const h of await ev("__unslop.headings()")) push("headings", "FAIL", h.evidence)
  for (const b of await ev("__unslop.brokenImages()")) push("broken-image", "FAIL", b.evidence)

  // forced pseudo states: focus visibility and state stability
  const { controls } = await ev(`__unslop.tag(${J(opts.allowMove)})`)
  const doc = await cdp.send("DOM.getDocument", { depth: 0 })
  const rects = () => ev("__unslop.rects()")

  // Entrance animations and late fonts move boxes on their own; measure
  // state stability only once two snapshots a beat apart agree.
  let baseline = await rects()
  for (let i = 0; ; i++) {
    await sleep(250)
    const cur = await rects()
    if (!diffRects(baseline, cur)) break
    baseline = cur
    if (i === 8) { push("state-moves", "WARN", "layout was still moving 2s after load; state stability was measured on a moving page"); break }
  }

  const described = new Map()
  const describe = async (i) => { if (!described.has(i)) described.set(i, await ev(`__unslop.describeIndex(${i})`)); return described.get(i) }
  let moves = 0, noFocus = 0
  // A box that stays moved after the pseudo state is released moved on its
  // own (a lazy image, a late animation): rebase and say nothing.
  const judge = async (moved, label, c) => {
    const released = await rects()
    if (diffRects(baseline, released)) { baseline = released; return }
    if (moves < 20) { moves++; push("state-moves", "FAIL", `${label} on ${c.desc} moved ${await describe(moved.i)} by ${moved.by}`) }
  }
  for (const c of controls.slice(0, opts.maxControls)) {
    let node
    try { node = (await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: c.sel })).nodeId } catch { continue }
    if (!node) continue
    const force = (classes) => cdp.send("CSS.forcePseudoState", { nodeId: node, forcedPseudoClasses: classes })

    const rest = await ev(`__unslop.focusSignature(${J(c.sel)})`)
    await force(["focus", "focus-visible"])
    const focused = await ev(`__unslop.focusSignature(${J(c.sel)})`)
    const movedF = c.disclosure ? null : diffRects(baseline, await rects())
    await force([])
    if (rest === focused && noFocus < 20) { noFocus++; push("no-focus", "FAIL", `${c.desc}: nothing changes under :focus-visible`) }
    if (movedF) await judge(movedF, ":focus", c)

    if (!c.disclosure) {
      await force(["hover"])
      const movedH = diffRects(baseline, await rects())
      await force([])
      if (movedH) await judge(movedH, ":hover", c)
    }
  }
  if (controls.length > opts.maxControls) push("state-moves", "WARN", `${controls.length} controls on the page, only the first ${opts.maxControls} were driven (--max-controls)`)

  if (opts.shots) {
    mkdirSync(opts.shots, { recursive: true })
    const height = await ev("Math.min(document.documentElement.scrollHeight, 8000)")
    const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } })
    const name = `${slug(url)}-${width}${opts.scheme === "dark" ? "-dark" : ""}.png`
    writeFileSync(join(opts.shots, name), Buffer.from(shot.data, "base64"))
    state.shots.push(join(opts.shots, name))
  }
  return findings
}

// WCAG 2 contrast, node side, for the pixel reads.
function wcagRatio(a, b) {
  const lum = ([r, g, bl]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl) }
  const l1 = lum(a), l2 = lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** Enough PNG to read a screenshot clip: 8-bit RGB or RGBA, no interlace, all five scanline filters. */
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw new Error("png: unsupported depth or interlace") }
    else if (type === "IDAT") idat.push(data)
    else if (type === "IEND") break
    pos += 12 + len
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : null
  if (!bpp) throw new Error(`png: colour type ${ct}`)
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const row = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = prev ? prev[i] : 0, c = i >= bpp && prev ? prev[i - bpp] : 0
      let v = src[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      row[i] = v & 255
    }
  }
  const px = []
  for (let i = 0; i < w * h; i++) px.push([out[i * bpp], out[i * bpp + 1], out[i * bpp + 2]])
  return { w, h, px }
}

function describeMode(m) {
  const parts = []
  if (m.title) parts.push(`"${m.title.slice(0, 40)}"`)
  if (m.cls) parts.push(`html.${m.cls.trim().split(/\s+/).join(".")}`)
  if (m.dataTheme) parts.push(`data-theme=${m.dataTheme}`)
  if (m.filter && m.filter !== "none") parts.push(`html filter: ${m.filter} (contrast is read from the filtered pixels against the unfiltered text colour)`)
  return parts.join(" · ") || "no title, no html class"
}

/** First element whose box changed by more than half a pixel, with the largest delta named. */
function diffRects(before, after) {
  const n = Math.min(before.length, after.length)
  for (let i = 0; i < n; i++) {
    const a = before[i], b = after[i]
    const d = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]), Math.abs(a[3] - b[3])]
    const k = d.indexOf(Math.max(...d))
    if (d[k] > 0.5) return { i, by: `${Math.round(d[k])}px (${["x", "y", "width", "height"][k]})` }
  }
  return null
}

function slug(url) {
  const s = url.startsWith("file:") ? basename(fileURLToPath(url)).replace(/\.[a-z]+$/i, "") : url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-")
  return s.replace(/^-+|-+$/g, "").slice(0, 60) || "page"
}

async function run(targets) {
  const { cdp, close } = await launch()
  const state = { shots: [] }
  const all = []
  try {
    await cdp.send("Page.enable")
    await cdp.send("DOM.enable")
    await cdp.send("CSS.enable")
    await cdp.send("Runtime.enable")
    if (opts.storage.length) {
      const seed = opts.storage.map(([k, v]) => `try { localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)}) } catch {}`).join("\n")
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: seed })
    }
    for (const t of targets) for (const w of opts.widths) all.push(...(await runTarget(cdp, t, w, state)))
  } finally {
    close()
  }
  return { findings: all, shots: state.shots }
}

function report({ findings, shots }, targets) {
  if (opts.json) { console.log(JSON.stringify({ scheme: opts.scheme, widths: opts.widths, findings, shots }, null, 2)); return }
  for (const t of targets) for (const w of opts.widths) {
    const all = findings.filter((f) => f.target === t && f.width === w)
    const note = all.find((f) => f.check === "page")
    const here = all.filter((f) => f.check !== "page")
    console.log(`\nunslop render · ${t} · ${w}px · ${opts.scheme}${note ? `\n  page: ${note.evidence}` : ""}`)
    if (!here.length) { console.log("  clean"); continue }
    for (const f of here) console.log(`  ${f.grade} ${f.check.padEnd(12)} ${f.evidence}\n       -> ${f.fix}`)
  }
  const fails = findings.filter((f) => f.grade === "FAIL").length
  const warns = findings.filter((f) => f.grade === "WARN").length
  console.log(`\n${fails} FAIL, ${warns} WARN across ${targets.length * opts.widths.length} screens${shots.length ? `; ${shots.length} screenshots in ${dirname(shots[0])}` : ""}`)
}

// ------------------------------------------------------------- selftest

async function selftest() {
  const slop = join(FIXTURES, "slop.html"), clean = join(FIXTURES, "clean.html")
  for (const f of [slop, clean]) if (!existsSync(f)) { console.error(`selftest: missing fixture ${f}`); process.exit(2) }
  const checks = Object.keys(FIX)
  const { findings } = await run([pathToFileURL(slop).href, pathToFileURL(clean).href])
  // A Reflex check reports WARN by design, so it counts as caught; on clean,
  // a WARN is as much a false positive as a FAIL.
  const fired = (file, check) => findings.some((f) => f.target.endsWith(file) && f.check === check && f.grade !== "NOTE")
  let ok = true
  for (const c of checks) {
    const onSlop = fired("slop.html", c), onClean = fired("clean.html", c)
    const pass = onSlop && !onClean
    ok &&= pass
    console.log(`${pass ? "PASS" : "FAIL"} ${c.padEnd(12)} slop: ${onSlop ? "caught" : "MISSED"} · clean: ${onClean ? "FALSE POSITIVE" : "quiet"}`)
  }
  if (!ok) {
    console.log("\nfindings:")
    for (const f of findings) console.log(`  ${basename(f.target)} ${f.width}px ${f.grade} ${f.check}: ${f.evidence}`)
  }
  console.log(ok ? "\nselftest passed: every check caught its planted positive and stayed quiet on clean" : "\nselftest FAILED")
  process.exit(ok ? 0 : 1)
}

try {
  if (opts.selftest) await selftest()
  else {
    // An origin-only http target (http://localhost:3000) expands to the configured routes.
    // --no-route-expansion: the caller already expanded them (the hook does).
    const targets = opts.targets.flatMap((t) => (opts.noRouteExpansion ? [t] : expandRoutes(t, opts.routes))).map(toUrl)
    const result = await run(targets)
    report(result, targets)
    process.exit(result.findings.some((f) => f.grade === "FAIL") ? 1 : 0)
  }
} catch (err) {
  console.error(`render.mjs: ${err.message}`)
  process.exit(2)
}
