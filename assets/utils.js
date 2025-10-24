(() => {
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit' });

  const timeAgo = (iso) => {
    const d = new Date(iso); const s = Math.floor((Date.now()-d)/1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s/60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
    const d2 = Math.floor(h/24); if (d2 < 30) return `${d2}d ago`;
    const mo = Math.floor(d2/30); if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(mo/12); return `${y}y ago`;
  };

  const prettyBytes = (num) => {
    if (!num && num !== 0) return '';
    if (num === 0) return '0 B';
    const u = ['B','KB','MB','GB','TB']; const i = Math.floor(Math.log(num)/Math.log(1024));
    return `${(num/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`;
  };

  /* ---------- Local cache (ETag) + throttled queue ---------- */
  const CACHE_NS = 'gh_cache:';
  const getCache = (path) => { try { const raw = localStorage.getItem(CACHE_NS+path); return raw ? JSON.parse(raw) : null; } catch { return null; } };
  const setCache = (path, etag, data) => { try { localStorage.setItem(CACHE_NS+path, JSON.stringify({ etag, data, ts: Date.now() })); } catch {} };

  const limit = 4; let active = 0; const queue = [];
  const runNext = () => { if (active >= limit) return; const job = queue.shift(); if (!job) return; active++; job().finally(()=>{ active--; runNext(); }); };
  const enqueue = (fn) => new Promise((resolve,reject)=>{ queue.push(() => fn().then(resolve,reject)); runNext(); });

  /* ---------- GitHub helpers with 429/403 resilience ---------- */
  const api = (path, init={}) => enqueue(async () => {
    const url = `https://api.github.com${path}`;
    const cached = getCache(path);
    const headers = { 'Accept':'application/vnd.github+json', ...(init.headers||{}) };
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    const res = await fetch(url, { ...init, headers });
    if (res.status === 304 && cached) return cached.data;
    if ((res.status === 429 || res.status === 403) && cached) { console.warn('Using cached GitHub data:', path); return cached.data; }
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
    const etag = res.headers.get('etag') || null;
    const data = await res.json(); if (etag) setCache(path, etag, data); return data;
  });

  const apiRaw  = (path, init={}) => enqueue(async () => fetch(`https://api.github.com${path}`, { ...init, headers: { 'Accept':'application/vnd.github+json', ...(init.headers||{}) } }));
  const apiHTML = (path) => enqueue(async () => {
    const url = `https://api.github.com${path}`;
    const cached = getCache(path+'#html');
    const headers = { 'Accept': 'application/vnd.github.html' };
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    const res = await fetch(url, { headers });
    if (res.status === 304 && cached) return cached.data;
    if ((res.status === 429 || res.status === 403) && cached) { console.warn('Using cached README HTML:', path); return cached.data; }
    if (!res.ok) return null;
    const etag = res.headers.get('etag') || null;
    const html = await res.text(); if (etag) setCache(path+'#html', etag, html); return html;
  });

  /* ---------- Optional local metadata & offline fallback ---------- */
  const loadAppMeta = async () => {
    try { const head = await fetch('./assets/apps.json', { method:'HEAD', cache:'no-store' }); if (!head.ok) return {}; const res = await fetch('./assets/apps.json', { cache:'no-store' }); if (!res.ok) return {}; return await res.json(); }
    catch { return {}; }
  };
  const loadFallback = async () => {
    try { const head = await fetch('./assets/fallback.json', { method:'HEAD', cache:'no-store' }); if (!head.ok) return null; const res = await fetch('./assets/fallback.json', { cache:'no-store' }); if (!res.ok) return null; return await res.json(); }
    catch { return null; }
  };

  /* ---------- Icons & images ---------- */
  const probeImage = (url) => new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(true); img.onerror = () => resolve(false); img.referrerPolicy='no-referrer'; img.decoding='async'; img.src = url; });
  const iconCandidates = (owner, repo, meta={}) => {
    const list = []; if (meta.icon) list.push(meta.icon);
    list.push(`https://opengraph.githubassets.com/1/${owner}/${repo}`);
    const base = `https://raw.githubusercontent.com/${owner}/${repo}/main`;
    list.push(`${base}/icon.png`, `${base}/icon.jpg`, `${base}/assets/icon.png`, `${base}/assets/icon.jpg`, `${base}/app/icon.png`);
    return list;
  };
  const safeImage = async (urls) => { for (const u of urls) { try { if (await probeImage(u)) return u; } catch {} } return null; };

  /* ---------- Regex & asset pick ---------- */
  const toRegex = (pattern, defaultFlags='i') => { if (!pattern || typeof pattern !== 'string') return null; try { let p=pattern.trim(); const m=p.match(/^\/(.*)\/([gimsuy]*)$/); let flags=defaultFlags; if (m){ p=m[1]; flags=m[2]||defaultFlags; } p=p.replace(/\(\?i\)/gi,''); if(!flags.includes('i')) flags+='i'; return new RegExp(p,flags);} catch { return null; } };
  const pickAsset = (release, pattern) => {
    const assets = release?.assets || []; if (!assets.length) return null;
    const rx = toRegex(pattern); if (rx){ const m=assets.find(a=>rx.test(a.name)); if (m) return m; }
    const priority=[/(\.exe|\.msi)$/i, /\.dmg$/i, /(AppImage|\.deb|\.rpm)$/i, /\.apk$/i, /\.zip$/i, /\.tar\.(gz|xz)$/i];
    for (const test of priority){ const match=assets.find(a=>test.test(a.name)); if (match) return match; }
    return assets[0];
  };

  /* ---------- Topbar shadow & mobile menu ---------- */
  const header = document.getElementById('topbar');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  // Mobile nav toggle if present
  const menuBtn = document.querySelector('.menu-btn');
  const mobileMenu = document.getElementById('mobileMenu');
  const scrim = document.getElementById('scrim');
  const closeMenu = () => { document.body.dataset.navOpen = ""; menuBtn && menuBtn.setAttribute('aria-expanded','false'); };
  const openMenu  = () => { document.body.dataset.navOpen = "1"; menuBtn && menuBtn.setAttribute('aria-expanded','true'); };
  if (menuBtn && mobileMenu && scrim){
    menuBtn.addEventListener('click', () => (document.body.dataset.navOpen === "1" ? closeMenu() : openMenu()));
    scrim.addEventListener('click', closeMenu);
    mobileMenu.addEventListener('click', (e)=>{ if (e.target.matches('a')) closeMenu(); });
    window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });
  }

  window.$utils = {
    $, $$, fmtDate, timeAgo, prettyBytes,
    api, apiHTML, apiRaw,
    loadAppMeta, loadFallback,
    iconCandidates, safeImage,
    toRegex, pickAsset
  };
})();
