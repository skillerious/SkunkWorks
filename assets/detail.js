(() => {
  const {
    $, fmtDate, timeAgo, prettyBytes, api, apiHTML,
    loadAppMeta, iconCandidates, safeImage, pickAsset
  } = window.$utils;

  const params = new URLSearchParams(location.search);
  const repoName = params.get('repo');
  const owner = (window.APP_CFG && window.APP_CFG.owner) || 'skillerious';
  const Y = (sel) => document.querySelector(sel);
  if (Y('#year2')) Y('#year2').textContent = new Date().getFullYear();

  /* ---------------- Safe HTML sanitizer + URL resolver ---------------- */
  const resolveUrl = (url, { image=false } = {}) => {
    if (!url || /^https?:\/\//i.test(url) || url.startsWith('#') || /^mailto:/i.test(url)) return url;
    const clean = url.replace(/^\.\//, '').replace(/^\//, '');
    const rawBase  = `https://raw.githubusercontent.com/${owner}/${repoName}/main/`;
    const blobBase = `https://github.com/${owner}/${repoName}/blob/main/`;
    return (image ? rawBase : blobBase) + clean;
  };

  const ALLOWED = new Set([
    'a','abbr','b','blockquote','br','code','div','em','hr','i','img','kbd','li','ol','p','pre','s','small','span',
    'strong','sub','sup','u','ul','h1','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','details','summary'
  ]);
  const SELF = new Set(['br','hr','img']);

  const sanitizeHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => {
      if (node.nodeType === 3) return node.nodeValue;           // text
      if (node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED.has(tag)) return [...node.childNodes].map(walk).join(''); // unwrap

      const attrs = [];
      for (const a of node.attributes) {
        const name = a.name.toLowerCase();
        let value = a.value;

        if (name === 'style') continue;                         // drop inline styles
        if (tag === 'a' && name === 'href') {
          if (/^\s*javascript:/i.test(value)) continue;
          value = resolveUrl(value);
          attrs.push(`href="${value}" target="_blank" rel="noopener noreferrer"`);
          continue;
        }
        if (tag === 'img' && name === 'src') {
          const good = /^(https?:\/\/|data:image)/i.test(value) || !/^\w+:/.test(value);
          if (!good) continue;
          value = resolveUrl(value, { image:true });
          attrs.push(`src="${value}" loading="lazy" decoding="async"`);
          continue;
        }
        if (['alt','title','width','height','align','class','id'].includes(name)) {
          attrs.push(`${name}="${value.replace(/"/g,'&quot;')}"`);
        }
      }
      const open = `<${tag}${attrs.length? ' '+attrs.join(' ') : ''}>`;
      const children = [...node.childNodes].map(walk).join('');
      if (SELF.has(tag)) return open;
      return `${open}${children}</${tag}>`;
    };
    return [...doc.body.childNodes].map(walk).join('');
  };

  /* ---------------- Markdown → HTML (with raw HTML pass-through) ---------------- */
  const mdToHtml = (md) => {
    if (!md) return '';
    let text = md.replace(/\r\n?/g, '\n');

    // Extract fenced code blocks
    const blocks = [];
    text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
      const escaped = code.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
      blocks.push(`<pre><code>${escaped}</code></pre>`);
      return `\uE000BLOCK${blocks.length-1}\uE000`;
    });

    // Allow raw HTML (sanitized later), then add markdown sugar

    // Images ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) =>
      `<img alt="${alt}" src="${resolveUrl(url,{image:true})}" />`
    );

    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
      `<a href="${resolveUrl(url)}" target="_blank" rel="noopener">${label}</a>`
    );

    // Headings
    text = text.replace(/^######\s?(.*)$/gm, '<h6>$1</h6>')
               .replace(/^#####\s?(.*)$/gm, '<h5>$1</h5>')
               .replace(/^####\s?(.*)$/gm, '<h4>$1</h4>')
               .replace(/^###\s?(.*)$/gm,  '<h3>$1</h3>')
               .replace(/^##\s?(.*)$/gm,   '<h2>$1</h2>')
               .replace(/^#\s?(.*)$/gm,    '<h1>$1</h1>');

    // Emphasis & inline code
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
               .replace(/__([^_]+)__/g,     '<strong>$1</strong>')
               .replace(/(^|[^\*])\*([^*]+)\*/g, '$1<em>$2</em>')
               .replace(/(^|[^_])_([^_]+)_/g,   '$1<em>$2</em>')
               .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists
    text = text
      .replace(/^(?:\s*-\s+.*(?:\n|$))+?/gm, m => `<ul>\n${m.trim().split(/\n/).map(li=>li.replace(/^\s*-\s+/, '<li>') + '</li>').join('\n')}\n</ul>\n`)
      .replace(/^(?:\s*\d+\.\s+.*(?:\n|$))+?/gm, m => `<ol>\n${m.trim().split(/\n/).map(li=>li.replace(/^\s*\d+\.\s+/, '<li>') + '</li>').join('\n')}\n</ol>\n`);

    // Paragraphs (avoid wrapping existing block-level tags)
    text = text.split(/\n{2,}/).map(chunk => {
      if (/^\s*<(h\d|ul|ol|pre|img|blockquote|div|table|details)/i.test(chunk)) return chunk;
      return `<p>${chunk.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    // Reinsert code blocks
    text = text.replace(/\uE000BLOCK(\d+)\uE000/g, (_, i)=> blocks[Number(i)] || '');

    // Final sanitize (keeps allowed HTML)
    return sanitizeHTML(text);
  };

  /* --- README image reliability: fallback chain for GitHub images --- */
  function fixReadmeImages(container){
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
      img.decoding = 'async';
      img.loading = 'lazy';
      img.crossOrigin = 'anonymous';

      const original = img.getAttribute('src') || '';
      const fallbacks = [];

      // If it's a raw.githubusercontent.com URL, add a blob/raw fallback and ?raw=1 variant
      const RAW = /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i;
      const m = original.match(RAW);
      if (m) {
        const [, user, repo, branch, path] = m;
        fallbacks.push(`https://github.com/${user}/${repo}/raw/${branch}/${path}`);
        fallbacks.push(`${original}?raw=1`);
      }

      let tried = 0;
      img.addEventListener('error', () => {
        if (tried < fallbacks.length) {
          img.src = fallbacks[tried++];
        } else {
          img.classList.add('img-error'); // degrade gracefully
        }
      });
    });
  }

  const platformBadge = (name, size) =>
    `<span class="platform"><strong>${name}</strong>${size ? ` <small>• ${prettyBytes(size)}</small>` : ''}</span>`;

  async function loadScreenshots(meta){
    const shotsWrap = Y('#shots');
    const gallery = Y('#gallery');

    const list = meta.screenshots || [];
    const resolved = [];

    if (!list.length) {
      const base = `https://raw.githubusercontent.com/${owner}/${repoName}/main`;
      const guesses = [
        `${base}/screenshots/1.png`,
        `${base}/screenshots/2.png`,
        `${base}/assets/screenshots/1.png`,
        `${base}/assets/screenshots/2.png`
      ];
      for (const u of guesses) {
        try { const head = await fetch(u, { method:'HEAD', cache:'no-store' }); if (head.ok) resolved.push(u); } catch {}
      }
    } else { resolved.push(...list); }

    if (!resolved.length) return;
    shotsWrap.innerHTML = resolved.map(u => `<img src="${u}" alt="Screenshot" loading="lazy" />`).join('');
    gallery.classList.remove('hidden');
  }

  // README: prefer pre-rendered GitHub HTML, else raw markdown -> mdToHtml
  async function loadReadme(owner, repo) {
    const html = await apiHTML(`/repos/${owner}/${repo}/readme`);
    if (html) return html;

    const names = ['README.md','Readme.md','README.MD','README.markdown'];
    const branches = ['main','master'];
    for (const br of branches) {
      for (const nm of names) {
        const rawURL = `https://raw.githubusercontent.com/${owner}/${repo}/${br}/${nm}`;
        try {
          const head = await fetch(rawURL, { method:'HEAD', cache:'no-store' });
          if (head.ok) {
            const txt = await (await fetch(rawURL, { cache:'no-store' })).text();
            return mdToHtml(txt);
          }
        } catch {}
      }
    }
    return '<p class="muted">README not available.</p>';
  }

  // Tabs
  function initTabs(){
    const buttons = Array.from(document.querySelectorAll('.tab-btn'));
    const panels = {
      overview: Y('#tab-overview'),
      releases: Y('#tab-releases'),
      gallery: Y('#tab-gallery')
    };
    const activate = (key) => {
      buttons.forEach(b => b.classList.toggle('active', b.dataset.tab===key));
      Object.entries(panels).forEach(([k,el]) => el.classList.toggle('hidden', k!==key));
    };
    buttons.forEach(b => b.addEventListener('click', () => activate(b.dataset.tab)));
    return { activate };
  }

  async function load(){
    if (!repoName){ Y('#name').textContent = 'Missing repo param'; return; }
    const tabs = initTabs();

    const metaIndex = await loadAppMeta();
    const meta = metaIndex[repoName] || {};

    let repo = null, releases = [];
    try {
      [repo, releases] = await Promise.all([
        api(`/repos/${owner}/${repoName}`),
        api(`/repos/${owner}/${repoName}/releases?per_page=10`).catch(()=>[])
      ]);
    } catch (e) {
      console.warn('Repo metadata limited; using minimal meta if available.', e);
      repo = { name: repoName, description: meta.tagline || '', html_url: `https://github.com/${owner}/${repoName}`, language: '', stargazers_count: 0, pushed_at: new Date().toISOString(), homepage: '', forks_count: 0, watchers_count: 0, open_issues_count: 0 };
    }

    document.title = `${repo.name} — Skillerious`;
    Y('#title').textContent = document.title;
    Y('#repoLink').href = repo.html_url;

    Y('#name').textContent = meta.title || repo.name;
    Y('#tagline').textContent = meta.tagline || repo.description || '';
    Y('#lang').textContent = repo.language || '—';
    Y('#stars').textContent = `★ ${repo.stargazers_count || 0}`;
    Y('#updated').textContent = `Updated ${timeAgo(repo.pushed_at)}`;

    if (repo.homepage){ const a=Y('#homepage'); a.href = repo.homepage; a.hidden=false; }
    Y('#issues').href = `${repo.html_url}/issues`;

    // extra quick stats
    if (repo.forks_count != null){ const p=Y('#forksPill'); p.textContent = `Forks: ${repo.forks_count}`; p.hidden=false; }
    if (repo.watchers_count != null){ const p=Y('#watchersPill'); p.textContent = `Watchers: ${repo.watchers_count}`; p.hidden=false; }
    if (repo.open_issues_count != null){ const p=Y('#openIssuesPill'); p.textContent = `Open issues: ${repo.open_issues_count}`; p.hidden=false; }

    // icon
    const iconUrl = await safeImage(iconCandidates(owner, repoName, meta));
    const iconEl = Y('#icon'); if (iconUrl) iconEl.src = iconUrl; else iconEl.remove();

    // README (markdown + safe HTML allowed)
    try {
      const html = await loadReadme(owner, repoName);
      const container = Y('#readme');
      container.innerHTML = html;
      fixReadmeImages(container);  // <-- make images resilient and dark-friendly
    } catch {
      Y('#readme').innerHTML = '<p class="muted">README not available.</p>';
    }

    // Releases & assets
    const list = Y('#releaseList');
    const assetMenu = Y('#assetMenu');
    const assetList = Y('#assetList');
    if (!Array.isArray(releases) || releases.length===0){
      list.innerHTML = '<p class="muted">No releases (or temporarily unavailable).</p>';
      assetMenu.hidden = true;
    } else {
      const latest = releases[0];
      const preferred = pickAsset(latest, meta.preferred_asset);
      const version = latest.tag_name ? latest.tag_name.replace(/^v/i,'') : '';
      if (version) Y('#version').textContent = `v${version}`;

      // Primary download
      if (preferred) {
        const btn = Y('#primaryDownload');
        btn.textContent = `Download — ${preferred.name} (${prettyBytes(preferred.size || 0)})`;
        btn.href = preferred.browser_download_url;
        btn.hidden = false;
      }

      // Asset dropdown
      const assetsMarkup = (latest.assets||[]).map(a =>
        `<a href="${a.browser_download_url}" target="_blank" rel="noopener">
          <span>${a.name}</span><span>${prettyBytes(a.size||0)}</span>
        </a>`).join('');
      if (assetsMarkup){ assetList.innerHTML = assetsMarkup; assetMenu.hidden = false; }

      // Platform badges
      const platforms = (latest.assets || []).map(a => {
        const n = a.name;
        const label =
          /(\.exe|\.msi)$/i.test(n) ? 'Windows' :
          /\.dmg$/i.test(n) ? 'macOS' :
          /(AppImage|\.deb|\.rpm)$/i.test(n) ? 'Linux' :
          /\.apk$/i.test(n) ? 'Android' :
          /\.zip$/i.test(n) ? 'ZIP' : 'Asset';
        return platformBadge(label, a.size);
      }).join('');
      Y('#platforms').innerHTML = platforms;

      // Full release list (release notes rendered as markdown)
      list.innerHTML = releases.map(rel => {
        const assets = (rel.assets||[]).map(a=>`<a class="btn" href="${a.browser_download_url}" target="_blank" rel="noopener">${a.name} · ${prettyBytes(a.size||0)}</a>`).join('');
        const relDate = fmtDate(rel.published_at || rel.created_at);
        const notes = rel.body ? `<div class="readme" style="margin-top:8px">${mdToHtml(rel.body)}</div>` : '';
        return `<div class="rel-item">
          <div class="row"><strong>${rel.tag_name || 'untagged'}</strong><span class="pill">${relDate}</span></div>
          <p class="muted">${rel.name||''}</p>
          ${notes}
          <div class="rel-assets">${assets||'<span class="pill">No assets</span>'}</div>
        </div>`;
      }).join('');
    }

    await loadScreenshots(meta);

    const topReleases = Y('#topReleases');
    if (topReleases) {
      topReleases.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.activate('releases');
        document.getElementById('releases').scrollIntoView({ behavior:'smooth', block:'start' });
      });
    }
  }

  load().catch(err=>{
    console.error(err);
    Y('#readme').innerHTML = `<p class="muted">Failed to load repository data. ${err.message}</p>`;
  });
})();
