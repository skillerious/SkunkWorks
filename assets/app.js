(() => {
  const {
    $, $$, fmtDate, timeAgo, api, apiRaw,
    loadAppMeta, loadFallback, iconCandidates, safeImage
  } = window.$utils;

  const owner = (window.APP_CFG && window.APP_CFG.owner) || 'skillerious';

  const els = {
    apps: $('#apps'),
    stats: $('#stats'),
    q: $('#q'),
    lang: $('#langFilter'),
    cat: $('#catFilter'),
    hasReleases: $('#hasReleases'),
    featuredOnly: $('#featuredOnly'),
    refresh: $('#refresh'),
    year: $('#year')
  };
  if (els.year) els.year.textContent = new Date().getFullYear();

  let allRepos = [];
  let metaIndex = {};
  let releaseMap = new Map();
  const featuredSet = new Set((window.APP_CFG && window.APP_CFG.featured) || []);
  let isFallback = false;

  // ---------- UI helpers ----------
  const showError = (msg) => {
    els.apps.innerHTML = `
      <div class="alert">
        <strong>Heads-up:</strong> ${msg}
        <div style="margin-top:10px">
          <code>assets/fallback.json</code> was not found. Add it to enable “limited data mode”.
        </div>
      </div>`;
    els.apps.setAttribute('aria-busy','false');
  };

  async function load() {
    els.apps.setAttribute('aria-busy','true');

    const meta = await loadAppMeta();
    metaIndex = meta || {};

    let user, repos;
    try {
      [user, repos] = await Promise.all([
        api(`/users/${owner}`),
        api(`/users/${owner}/repos?per_page=${(window.APP_CFG && window.APP_CFG.perPage) || 100}&type=owner&sort=updated`)
      ]);
      isFallback = false;
    } catch (e) {
      console.warn('Primary GitHub API failed; switching to offline fallback.', e);
      const fb = await loadFallback();
      if (fb?.user && Array.isArray(fb?.repos)) {
        user = fb.user;
        repos = fb.repos;
        isFallback = true;
      } else {
        showError(`Failed to load from GitHub API and no local fallback is available.<br>
          <small>${e.message}</small>`);
        return;
      }
    }

    allRepos = repos.filter(r => !r.archived && !r.private);

    // Stats
    const totalStars = allRepos.reduce((a,b)=>a+(b.stargazers_count||0),0);
    const limited = isFallback ? `<span class="pill">⚠ Limited data mode</span>` : '';
    els.stats.innerHTML = `
      ${limited}
      <span class="pill">Public repos: <strong>${user.public_repos ?? allRepos.length}</strong></span>
      <span class="pill">Followers: <strong>${user.followers ?? '—'}</strong></span>
      <span class="pill">Total stars: <strong>${totalStars}</strong></span>
      <span class="pill">Updated: <strong>${fmtDate(new Date().toISOString())}</strong></span>`;

    const langs = [...new Set(allRepos.map(r=>r.language).filter(Boolean))].sort();
    els.lang.innerHTML = '<option value="">All languages</option>' + langs.map(l=>`<option>${l}</option>`).join('');

    const cats = [...new Set(Object.values(metaIndex).flatMap(m => m.categories || []))].sort();
    els.cat.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option>${c}</option>`).join('');

    render();

    if (!isFallback) ensureReleasePresence('featured').catch(()=>{});
    else els.apps.setAttribute('aria-busy','false');
  }

  function versionBadge(repo){
    const r = releaseMap.get(repo.name);
    if (!r?.ok) return '';
    const date = r.published_at ? fmtDate(r.published_at) : '';
    return `<span class="pill">v${(r.tag||'').replace(/^v/i,'')}${date ? ` • ${date}` : ''}</span>`;
  }

  function matches(repo, q, lang, cat, onlyRel, featuredOnly){
    const meta = metaIndex[repo.name] || {};
    if (lang && repo.language !== lang) return false;
    if (cat && !(meta.categories || []).includes(cat)) return false;
    if (featuredOnly && !featuredSet.has(repo.name)) return false;

    if (q) {
      const s = q.toLowerCase();
      const nm = (repo.name||'').toLowerCase();
      const ds = (repo.description||'').toLowerCase();
      const tg = (meta.tagline||'').toLowerCase();
      if (!nm.includes(s) && !ds.includes(s) && !tg.includes(s)) return false;
    }
    if (!onlyRel) return true;
    const rel = releaseMap.get(repo.name);
    return rel?.ok === true;
  }

  function card(repo){
    const meta = metaIndex[repo.name] || {};
    const updated = `${fmtDate(repo.pushed_at)} • ${timeAgo(repo.pushed_at)}`;
    const lang = repo.language || '—';
    const tagline = meta.tagline || repo.description || '';
    const featured = featuredSet.has(repo.name);

    const icon = meta.iconResolved || '';
    const iconImg = icon ? `<img class="icon" src="${icon}" alt="${repo.name} icon" loading="lazy" />` : '';

    return `
      <article class="card" ${featured ? 'data-featured="true"' : ''}>
        <div class="row">
          <h3>${repo.name}</h3>
          <span class="pill">${lang}</span>
        </div>
        <div class="row">
          ${iconImg}
          <p style="flex:1">${tagline}</p>
        </div>
        <div class="tags">
          <span class="pill">★ ${repo.stargazers_count||0}</span>
          ${versionBadge(repo)}
          <span class="pill">${updated}</span>
        </div>
        <div class="cta">
          <a class="btn" href="./app.html?repo=${encodeURIComponent(repo.name)}">Open app page</a>
          <a class="btn ghost" href="${repo.html_url}" target="_blank" rel="noopener">GitHub</a>
          ${repo.homepage ? `<a class="btn ghost" href="${repo.homepage}" target="_blank" rel="noopener">Website</a>` : ''}
        </div>
      </article>`;
  }

  async function resolveIcons(subset){
    await Promise.all(subset.map(async repo => {
      const meta = metaIndex[repo.name] || {};
      if (meta.iconResolved) return;
      meta.iconResolved = await safeImage(iconCandidates(owner, repo.name, meta)) || '';
      metaIndex[repo.name] = meta;
    }));
  }

  function render(){
    const q = els.q.value.trim();
    const lang = els.lang.value;
    const cat = els.cat.value;
    const onlyRel = els.hasReleases.checked;
    const featuredOnly = els.featuredOnly.checked;

    const sorted = [...allRepos].sort((a,b) => {
      const fa = featuredSet.has(a.name) ? 0 : 1;
      const fb = featuredSet.has(b.name) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (new Date(b.pushed_at)) - (new Date(a.pushed_at));
    });

    const subset = sorted.filter(r => matches(r, q, lang, cat, onlyRel, featuredOnly));
    resolveIcons(subset).then(() => {
      const again = sorted.filter(r => matches(r, q, lang, cat, onlyRel, featuredOnly));
      els.apps.innerHTML = again.map(card).join('');
      els.apps.setAttribute('aria-busy','false');
    });

    els.apps.innerHTML = subset.map(card).join('');
  }

  async function ensureReleasePresence(mode='featured') {
    if (isFallback) return;

    let list = allRepos;
    if (mode === 'featured') list = allRepos.filter(r => featuredSet.has(r.name));
    if (mode === 'visible') {
      const q = els.q.value.trim();
      const lang = els.lang.value;
      const cat = els.cat.value;
      const onlyRel = els.hasReleases.checked;
      const featuredOnly = els.featuredOnly.checked;
      list = allRepos.filter(r => matches(r, q, lang, cat, onlyRel, featuredOnly));
    }
    list = list.filter(r => !releaseMap.has(r.name));
    if (!list.length) return;

    let idx = 0;
    const concurrency = 4;
    const worker = async () => {
      while (idx < list.length) {
        const r = list[idx++];
        try {
          const res = await apiRaw(`/repos/${owner}/${r.name}/releases/latest`);
          if (res.status === 404) { releaseMap.set(r.name, { ok:false }); continue; }
          if (!res.ok) { releaseMap.set(r.name,{ ok:false }); continue; }
          const data = await res.json();
          releaseMap.set(r.name, { ok:true, tag:data.tag_name || '', published_at:data.published_at || data.created_at || ''});
        } catch { releaseMap.set(r.name, { ok:false }); }
      }
    };
    await Promise.allSettled(Array.from({length:concurrency}, worker));
    render();
  }

  // Events
  els.q.addEventListener('input', () => { render(); });
  els.lang.addEventListener('change', () => { render(); });
  els.cat.addEventListener('change', () => { render(); });
  els.hasReleases.addEventListener('change', () => { render(); ensureReleasePresence('visible'); });
  els.featuredOnly.addEventListener('change', () => { render(); });
  els.refresh.addEventListener('click', load);

  load().catch(err => {
    console.error(err);
    showError(`Failed to load from GitHub API and no fallback was found.<br><small>${err.message}</small>`);
  });
})();
