"use strict";

const $ = (id) => document.getElementById(id);
const els = {
  form: $("form"), search: $("search"), suggestions: $("suggestions"), animeInfo: $("animeInfo"),
  season: $("season"), episode: $("episode"), version: $("version"), versionField: $("versionField"),
  fillerField: $("fillerField"), skipFillers: $("skipFillers"), staySeason: $("staySeason"),
  epDur: $("epDur"), epCount: $("epCount"), epCountLabel: $("epCountLabel"),
  hours: $("hours"), minutes: $("minutes"), until: $("until"), untilHint: $("untilHint"),
  durationBox: $("durationBox"), untilBox: $("untilBox"),
  skipOp: $("skipOp"), skipEd: $("skipEd"), opKeep: $("opKeep"), edKeep: $("edKeep"),
  opDur: $("opDur"), edDur: $("edDur"), speed: $("speed"), pause: $("pause"),
  result: $("result"), formError: $("formError"), animeAdvanced: $("animeAdvanced")
};

const STORE_KEY = "anime-clock:v1";
let anime = null;        // anime sélectionné (format du catalogue)
let calculated = false;  // après un premier calcul, on recalcule à chaque changement

/* ---------- Outils ---------- */

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function parseRanges(str) {
  const set = new Set();
  if (!str) return set;
  for (const part of str.split(",")) {
    const [a, b] = part.split("-").map(Number);
    for (let n = a; n <= (b || a); n++) set.add(n);
  }
  return set;
}

function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec < 60) return `${sec} s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
}

const fmtClock = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function num(input, fallback = 0) {
  const v = parseFloat(String(input.value).replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

const plural = (n, one, many) => (n > 1 ? many : one);

const currentVersion = () => anime && anime.versions[Number(els.version.value) || 0];
const currentSeasonIdx = () => Number(els.season.value) || 0;

/* ---------- Recherche ---------- */

let activeIndex = -1;
let jikanCtrl = null;
let jikanTimer = null;
let jikanItems = [];
let jikanFailed = false;
let jikanDone = false;

function localMatches(q) {
  const n = norm(q.trim());
  if (!n) return CATALOG.slice(0, 8);
  return CATALOG.filter((a) => norm(a.title + " " + (a.alt || "")).includes(n)).slice(0, 8);
}

function renderSuggestions(q) {
  const local = localMatches(q);
  const ul = els.suggestions;
  ul.innerHTML = "";
  const items = [];

  const addGroup = (label) => {
    const li = document.createElement("li");
    li.className = "group";
    li.setAttribute("role", "presentation");
    li.textContent = label;
    ul.appendChild(li);
  };
  const addItem = (label, meta, onPick) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.innerHTML = `<span></span><span class="meta"></span>`;
    li.firstChild.textContent = label;
    li.lastChild.textContent = meta;
    li.addEventListener("mousedown", (e) => { e.preventDefault(); onPick(); });
    ul.appendChild(li);
    items.push({ li, onPick });
  };

  if (local.length) {
    addGroup("Catalogue");
    for (const a of local) {
      const total = a.versions[0].seasons.reduce((s, x) => s + x.eps, 0);
      const meta = a.versions.length > 1 ? `${a.versions.length} versions` : `${total} ép.`;
      addItem(a.title, meta, () => pickAnime(a));
    }
  }

  const localIds = new Set(local.map((a) => norm(a.title)));
  const remote = jikanItems.filter((j) => !localIds.has(norm(j.title)));
  if (remote.length) {
    addGroup(`En ligne (${remote[0].source})`);
    for (const j of remote) {
      const eps = j.episodes ? `${j.episodes} ép.` : j.released ? `${j.released} ép. sortis` : "en cours";
      const meta = [j.type, j.year, eps].filter(Boolean).join(" · ");
      addItem(j.title, meta, () => pickAnime(fromRemote(j)));
    }
  } else if (q.trim().length >= 3 && jikanCtrl) {
    addGroup("En ligne : recherche…");
  } else if (q.trim().length >= 3 && jikanFailed) {
    addGroup("Recherche en ligne indisponible");
  } else if (q.trim().length >= 3 && jikanDone) {
    addGroup("En ligne : aucun résultat");
  }

  const typed = q.trim();
  if (typed && !local.some((a) => norm(a.title) === norm(typed))) {
    addGroup("Pas dans la liste ?");
    addItem(`« ${typed} »`, "saisie manuelle", () => pickAnime(manualAnime(typed)));
  }

  ul.hidden = ul.children.length === 0;
  els.search.setAttribute("aria-expanded", String(!ul.hidden));
  activeIndex = -1;
  ul._items = items;
}

function searchJikan(q) {
  clearTimeout(jikanTimer);
  if (jikanCtrl) jikanCtrl.abort();
  jikanCtrl = null;
  jikanItems = [];
  jikanDone = false;
  jikanFailed = false;
  if (q.trim().length < 3) return;
  jikanTimer = setTimeout(async () => {
    const ctrl = new AbortController();
    jikanCtrl = ctrl;
    jikanFailed = false;
    jikanDone = false;
    renderSuggestions(els.search.value);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, 8000);
    try {
      try {
        jikanItems = await searchAniList(q.trim(), ctrl.signal);
      } catch (e) {
        if (e.name === "AbortError") throw e;
        jikanItems = await searchJikanApi(q.trim(), ctrl.signal); // secours
      }
      jikanDone = true;
    } catch (e) {
      if (e.name === "AbortError" && !timedOut) return; // remplacée par une recherche plus récente
      jikanItems = [];
      jikanFailed = true;
    } finally {
      clearTimeout(timer);
    }
    if (jikanCtrl !== ctrl) return;
    jikanCtrl = null;
    if (document.activeElement === els.search) renderSuggestions(els.search.value);
  }, 350);
}

function parseJikanDuration(str) {
  if (!str) return 0;
  const h = /(\d+)\s*hr/.exec(str), m = /(\d+)\s*min/.exec(str), s = /(\d+)\s*sec/.exec(str);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (s ? +s[1] : 0);
}

// Source principale : AniList (GraphQL, accepte les appels depuis le navigateur).
async function searchAniList(q, signal) {
  const query = `query($s:String){Page(perPage:6){media(search:$s,type:ANIME,sort:SEARCH_MATCH,isAdult:false){
    id title{romaji english} format episodes duration seasonYear status nextAiringEpisode{episode}}}}`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { s: q } }),
    signal
  });
  if (!res.ok) throw new Error(res.status);
  const json = await res.json();
  const formats = { TV: "TV", TV_SHORT: "TV court", MOVIE: "Film", OVA: "OVA", ONA: "ONA", SPECIAL: "Spécial" };
  return ((json.data && json.data.Page.media) || []).map((m) => ({
    source: "AniList",
    id: "al-" + m.id,
    title: m.title.english || m.title.romaji,
    type: formats[m.format] || m.format,
    year: m.seasonYear,
    episodes: m.episodes,
    released: m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : null,
    durationSec: (m.duration || 0) * 60
  }));
}

// Secours : Jikan (MyAnimeList), souvent surchargé.
async function searchJikanApi(q, signal) {
  const url = `https://api.jikan.moe/v4/anime?limit=6&sfw=true&order_by=members&sort=desc&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(res.status);
  const json = await res.json();
  return (json.data || []).map((d) => ({
    source: "MyAnimeList",
    id: "mal-" + d.mal_id,
    title: d.title_english || d.title,
    type: d.type,
    year: d.year || (d.aired && d.aired.prop && d.aired.prop.from.year),
    episodes: d.episodes,
    released: null,
    durationSec: parseJikanDuration(d.duration)
  }));
}

function fromRemote(j) {
  const dur = j.durationSec || 1440;
  const credits = dur >= 600 ? 90 : 0;
  const eps = j.episodes || j.released || 12;
  return {
    id: j.id,
    title: j.title,
    api: true,
    unknownCount: !j.episodes,
    versions: [{
      id: "tv", label: j.type || "Série", dur, op: credits, ed: credits,
      seasons: [{ name: j.title, first: 1, eps }]
    }]
  };
}

function manualAnime(title) {
  return {
    id: "manual-" + norm(title).replace(/\W+/g, "-"),
    title,
    api: true,
    manual: true,
    versions: [{ id: "tv", label: "Série", ...STD, seasons: [{ name: title, first: 1, eps: 12 }] }]
  };
}

function moveActive(delta) {
  const items = els.suggestions._items || [];
  if (!items.length) return;
  activeIndex = (activeIndex + delta + items.length) % items.length;
  items.forEach((it, i) => it.li.setAttribute("aria-selected", String(i === activeIndex)));
  items[activeIndex].li.scrollIntoView({ block: "nearest" });
}

els.search.addEventListener("input", () => {
  renderSuggestions(els.search.value);
  searchJikan(els.search.value);
});
els.search.addEventListener("focus", () => { els.search.select(); renderSuggestions(""); });
els.search.addEventListener("blur", () => {
  els.suggestions.hidden = true;
  els.search.setAttribute("aria-expanded", "false");
  if (anime) els.search.value = anime.title;
});
els.search.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
  else if (e.key === "Enter") {
    const items = els.suggestions._items || [];
    if (!els.suggestions.hidden && items.length) {
      e.preventDefault();
      items[Math.max(activeIndex, 0)].onPick();
    }
  } else if (e.key === "Escape") { els.search.blur(); }
});

/* ---------- Sélection ---------- */

function pickAnime(a, restore = {}) {
  anime = a;
  els.search.value = a.title;
  els.suggestions.hidden = true;
  els.search.blur();

  els.version.innerHTML = a.versions.map((v, i) => `<option value="${i}">${escapeHtml(v.label)}</option>`).join("");
  els.version.value = String(restore.version ?? 0);
  if (!a.versions[els.version.value]) els.version.value = "0";
  els.versionField.hidden = a.versions.length < 2;

  els.epCount.parentElement.hidden = !a.api;
  els.epCountLabel.textContent = a.unknownCount ? "Épisodes sortis" : "Nombre d'épisodes";

  fillSeasons(restore.season ?? 0);
  if (restore.episode) els.episode.value = restore.episode;
  els.season.disabled = false;
  els.episode.disabled = false;
  if (a.versions.length > 1 || a.manual || a.unknownCount) els.animeAdvanced.open = true;
  onChange();
}

function fillSeasons(idx = 0) {
  const v = currentVersion();
  els.season.innerHTML = v.seasons.map((s, i) => {
    const last = s.first + s.eps - 1;
    const range = s.eps > 1 ? ` (${s.first}–${last})` : "";
    return `<option value="${i}">${escapeHtml(s.name)}${range}</option>`;
  }).join("");
  els.season.value = String(v.seasons[idx] ? idx : 0);

  els.fillerField.hidden = !v.fillers;
  if (!v.fillers) els.skipFillers.checked = false;
  if (anime.api) els.epCount.value = v.seasons[0].eps;
  applySeasonDefaults();
  updateInfo();
}

function applySeasonDefaults() {
  const v = currentVersion();
  const s = v.seasons[currentSeasonIdx()];
  els.epDur.value = +(((s.dur ?? v.dur) / 60).toFixed(1));
  els.opDur.value = s.op ?? v.op;
  els.edDur.value = s.ed ?? v.ed;
  for (const el of [els.epDur, els.opDur, els.edDur]) delete el.dataset.touched;
  const last = s.first + s.eps - 1;
  els.episode.min = s.first;
  els.episode.max = last;
  els.episode.placeholder = String(s.first);
  els.episode.value = "";
}

function updateInfo() {
  if (!anime) { els.animeInfo.textContent = ""; return; }
  const v = currentVersion();
  const total = v.seasons.reduce((sum, s) => sum + s.eps, 0);
  const parts = [];
  if (v.seasons.length > 1) parts.push(`${v.seasons.length} saisons ou arcs`);
  parts.push(anime.unknownCount ? "série en cours : vérifie le nombre d'épisodes sortis dans Avancé" : `${total} ${plural(total, "épisode", "épisodes")}`);
  parts.push(`≈ ${Math.round(v.dur / 60)} min l'épisode`);
  if (v.fillers) parts.push(`${parseRanges(v.fillers).size} fillers`);
  if (anime.versions.length > 1) parts.push(`${anime.versions.length} versions (voir Avancé)`);
  if (anime.api) parts.push("génériques estimés");
  els.animeInfo.textContent = anime.manual
    ? "Saisie manuelle : indique le nombre d'épisodes et leur durée dans Avancé."
    : parts.join(" · ");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

els.version.addEventListener("change", () => { fillSeasons(0); onChange(); });
els.season.addEventListener("change", () => { applySeasonDefaults(); onChange(); });
for (const el of [els.epDur, els.opDur, els.edDur]) {
  el.addEventListener("input", () => { el.dataset.touched = "1"; });
}
els.epCount.addEventListener("input", () => {
  if (!anime || !anime.api) return;
  const n = Math.max(1, Math.round(num(els.epCount, 1)));
  const s = anime.versions[0].seasons[0];
  s.eps = n;
  els.episode.max = n;
  els.season.options[0].textContent = n > 1 ? `${s.name} (1–${n})` : s.name;
});

/* ---------- Temps disponible ---------- */

function mode() { return els.form.elements.mode.value; }

function untilTarget(now = new Date()) {
  const [h, m] = (els.until.value || "23:00").split(":").map(Number);
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t;
}

function availableSeconds(now = new Date()) {
  if (mode() === "until") return (untilTarget(now) - now) / 1000;
  return Math.max(0, num(els.hours)) * 3600 + Math.max(0, num(els.minutes)) * 60;
}

function refreshUntilHint() {
  if (mode() !== "until") return;
  const now = new Date();
  const t = untilTarget(now);
  const tomorrow = t.getDate() !== now.getDate() ? " (demain)" : "";
  els.untilHint.textContent = `Il te reste ${fmtDur((t - now) / 1000)}${tomorrow}.`;
}
setInterval(() => { refreshUntilHint(); if (calculated && mode() === "until") calculate(); }, 30000);

for (const r of els.form.elements.mode) {
  r.addEventListener("change", () => {
    els.durationBox.hidden = mode() !== "duration";
    els.untilBox.hidden = mode() !== "until";
    refreshUntilHint();
    onChange();
  });
}
els.until.addEventListener("input", refreshUntilHint);

document.querySelectorAll(".chips button").forEach((b) => {
  b.addEventListener("click", () => {
    const total = Number(b.dataset.min);
    els.hours.value = Math.floor(total / 60);
    els.minutes.value = total % 60;
    onChange();
  });
});

function syncCreditInputs() {
  els.opKeep.disabled = !els.skipOp.checked;
  els.edKeep.disabled = !els.skipEd.checked;
}
els.skipOp.addEventListener("change", syncCreditInputs);
els.skipEd.addEventListener("change", syncCreditInputs);

/* ---------- Calcul ---------- */

// Liste des épisodes à partir du point de départ, dans l'ordre.
function* episodes({ stayInSeason }) {
  const v = currentVersion();
  const sIdx = currentSeasonIdx();
  const fillers = els.skipFillers.checked ? parseRanges(v.fillers) : new Set();
  const start = Math.round(num(els.episode, 0));
  const over = {
    dur: els.epDur.dataset.touched ? num(els.epDur) * 60 : null,
    op: els.opDur.dataset.touched ? num(els.opDur) : null,
    ed: els.edDur.dataset.touched ? num(els.edDur) : null
  };
  for (let i = sIdx; i < v.seasons.length; i++) {
    const s = v.seasons[i];
    const from = i === sIdx && start ? start : s.first;
    for (let n = from; n < s.first + s.eps; n++) {
      if (fillers.has(n)) continue;
      yield {
        n, season: s.name, seasonIdx: i,
        dur: over.dur ?? s.dur ?? v.dur,
        op: over.op ?? s.op ?? v.op,
        ed: over.ed ?? s.ed ?? v.ed
      };
    }
    if (stayInSeason) return;
  }
}

function settings() {
  return {
    skipOp: els.skipOp.checked,
    skipEd: els.skipEd.checked,
    opKeep: Math.max(0, Math.round(num(els.opKeep))),
    edKeep: Math.max(0, Math.round(num(els.edKeep))),
    speed: num(els.speed, 1) || 1,
    pause: Math.max(0, num(els.pause)) * 60
  };
}

// Durée réelle du i-ème épisode de la session.
function cost(ep, i, cfg) {
  const watchOp = !cfg.skipOp || i < cfg.opKeep;
  const watchEd = !cfg.skipEd || i < cfg.edKeep;
  const op = Math.min(ep.op, ep.dur), ed = Math.min(ep.ed, ep.dur - op);
  const shown = { op: watchOp ? op : 0, ed: watchEd ? ed : 0, core: ep.dur - op - ed };
  const total = (shown.op + shown.ed + shown.core) / cfg.speed;
  return { total, shown, saved: (ep.dur - shown.op - shown.ed - shown.core) / cfg.speed };
}

function validate() {
  if (!anime) return "Choisis un anime.";
  const v = currentVersion();
  const s = v.seasons[currentSeasonIdx()];
  const start = els.episode.value.trim();
  if (start) {
    const n = Number(start);
    if (!Number.isInteger(n) || n < s.first || n > s.first + s.eps - 1) {
      return `L'épisode doit être entre ${s.first} et ${s.first + s.eps - 1} pour « ${s.name} ».`;
    }
  }
  if (num(els.epDur) <= 0) return "La durée d'un épisode doit être positive.";
  if (availableSeconds() <= 0) return "Indique un temps disponible.";
  return "";
}

function calculate() {
  const err = validate();
  els.formError.textContent = err;
  if (err) return false;

  const cfg = settings();
  const now = new Date();
  const T = availableSeconds(now);
  const stay = els.staySeason.checked;

  const watched = [];
  let used = 0, saved = 0, next = null, nextPause = 0;
  let i = 0;
  for (const ep of episodes({ stayInSeason: stay })) {
    const c = cost(ep, i, cfg);
    const p = i > 0 ? cfg.pause : 0;
    if (used + p + c.total > T) { next = { ep, c }; nextPause = p; break; }
    used += p;
    watched.push({ ep, c, start: used });
    used += c.total;
    saved += c.saved;
    i++;
  }

  // Temps restant pour finir la saison et la série, au même rythme.
  const startSeason = currentSeasonIdx();
  let seasonLeft = 0, seriesLeft = 0, seasonEps = 0, seriesEps = 0, k = 0;
  for (const ep of episodes({ stayInSeason: false })) {
    const t = cost(ep, k, cfg).total + (k > 0 ? cfg.pause : 0);
    seriesLeft += t; seriesEps++;
    if (ep.seasonIdx === startSeason) { seasonLeft += t; seasonEps++; }
    k++;
  }

  render({ watched, used, saved, next, nextPause, T, now, seasonLeft, seriesLeft, seasonEps, seriesEps, stay });
  save();
  return true;
}

/* ---------- Affichage ---------- */

function render(r) {
  const { watched, used, saved, next, nextPause, T, now } = r;
  const n = watched.length;
  const v = currentVersion();
  const leftover = T - used;
  const end = new Date(now.getTime() + used * 1000);
  const multiSeason = new Set(watched.map((w) => w.ep.seasonIdx)).size > 1;

  let sub;
  if (n === 0) {
    sub = next
      ? `Il te manque ${fmtDur(next.c.total + nextPause - leftover)} pour voir l'épisode ${next.ep.n} en entier.`
      : "Il n'y a plus d'épisode à partir de ce point.";
  } else if (n === 1) {
    sub = `L'épisode ${watched[0].ep.n} · ${watched[0].ep.season}`;
  } else {
    const a = watched[0].ep, b = watched[n - 1].ep;
    sub = multiSeason
      ? `De l'épisode ${a.n} (${a.season}) à l'épisode ${b.n} (${b.season})`
      : `Du ${a.n} au ${b.n} · ${a.season}`;
  }

  const stats = [];
  if (n) stats.push([fmtClock(end), "fin si tu lances maintenant"]);
  stats.push([fmtDur(leftover), "de marge"]);
  if (next && n) stats.push([fmtDur(next.c.total + nextPause - leftover), "manquent pour un épisode de plus"]);
  if (saved >= 30) stats.push([fmtDur(saved), "gagnées sur les génériques"]);

  // Frise
  let bar = "";
  for (const w of watched) {
    const pct = (w.c.total / T) * 100;
    const s = w.c.shown, tot = s.op + s.ed + s.core;
    bar += `<div class="ep" style="width:${pct}%" title="Épisode ${w.ep.n} · ${fmtDur(w.c.total)}">` +
      (s.op ? `<div class="opp" style="width:${(s.op / tot) * 100}%"></div>` : "") +
      `<div class="core"></div>` +
      (s.ed ? `<div class="edp" style="width:${(s.ed / tot) * 100}%"></div>` : "") +
      `</div>`;
  }
  if (next && leftover > 0) {
    bar += `<div class="partial" style="width:${(leftover / T) * 100}%" title="Marge"></div>`;
  }

  // Liste des épisodes
  const fillers = parseRanges(v.fillers);
  const row = (w) => {
    const t = new Date(now.getTime() + w.start * 1000);
    const tag = multiSeason ? `<span class="tag">${escapeHtml(w.ep.season)}</span>` : "";
    return `<li><span>Épisode ${w.ep.n}${tag}</span><time>${fmtClock(t)} · ${fmtDur(w.c.total)}</time></li>`;
  };
  let list = "";
  if (n > 30) {
    list = watched.slice(0, 15).map(row).join("") +
      `<li class="gap">… ${n - 20} épisodes …</li>` +
      watched.slice(-5).map(row).join("");
  } else {
    list = watched.map(row).join("");
  }

  // Notes
  const notes = [];
  if (next && n) {
    const pct = Math.floor((Math.max(0, leftover - nextPause) / next.c.total) * 100);
    if (pct >= 10) notes.push(`Avec la marge, tu verrais ${pct} % de l'épisode ${next.ep.n} avant de couper.`);
  }
  if (!next && n) {
    notes.push(`<span class="done">Tu arrives au bout ${r.stay ? "de la saison" : "de la série"}.</span>`);
  } else if (n) {
    const sessions = (left) => Math.ceil(left / Math.max(T, 1));
    if (r.seasonLeft > used && v.seasons.length > 1) {
      notes.push(`Pour finir la saison : ${fmtDur(r.seasonLeft)} (${r.seasonEps} ép.), soit ${sessions(r.seasonLeft)} sessions comme celle-ci.`);
    }
    if (r.seriesLeft > used && !r.stay) {
      const label = anime.unknownCount ? "rattraper les épisodes sortis" : "finir la série";
      notes.push(`Pour ${label} : ${fmtDur(r.seriesLeft)} (${r.seriesEps} ép.), soit ${sessions(r.seriesLeft)} sessions comme celle-ci.`);
    }
  }
  if (els.skipFillers.checked && fillers.size) notes.push("Les fillers sont retirés du compte.");

  els.result.innerHTML = `
    <h2>${escapeHtml(anime.title)}${anime.versions.length > 1 ? " · " + escapeHtml(v.label) : ""}</h2>
    <div class="big"><strong>${n}</strong><span>${plural(n, "épisode", "épisodes")}</span></div>
    <p class="sub">${escapeHtml(sub)}</p>
    <div class="stats">${stats.map(([b, s]) => `<div class="stat"><b>${b}</b><small>${s}</small></div>`).join("")}</div>
    ${n ? `<div class="timeline" aria-hidden="true">${bar}</div>
    <div class="legend"><span><i style="background:var(--op)"></i>Intro</span><span><i style="background:var(--accent)"></i>Épisode</span><span><i style="background:var(--ed)"></i>Outro</span><span><i class="partial" style="border:1px solid var(--border)"></i>Marge</span></div>
    <ul class="eplist">${list}</ul>` : ""}
    ${notes.map((t) => `<p class="note">${t}</p>`).join("")}
  `;
  els.result.hidden = false;
}

/* ---------- Événements ---------- */

function onChange() {
  updateInfo();
  if (calculated) calculate();
  else save();
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (calculate()) {
    calculated = true;
    if (window.matchMedia("(max-width: 899px)").matches) {
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

for (const el of [els.episode, els.skipFillers, els.staySeason, els.epDur, els.epCount, els.hours, els.minutes,
  els.until, els.skipOp, els.skipEd, els.opKeep, els.edKeep, els.opDur, els.edDur, els.speed, els.pause]) {
  el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", onChange);
}

/* ---------- Mémoire locale ---------- */

function save() {
  const data = {
    anime: anime ? (anime.api ? anime : anime.id) : null,
    version: els.version.value, season: els.season.value, episode: els.episode.value,
    mode: mode(), hours: els.hours.value, minutes: els.minutes.value, until: els.until.value,
    skipOp: els.skipOp.checked, skipEd: els.skipEd.checked, opKeep: els.opKeep.value, edKeep: els.edKeep.value,
    speed: els.speed.value, pause: els.pause.value, skipFillers: els.skipFillers.checked, staySeason: els.staySeason.checked
  };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* stockage indisponible */ }
}

function restore() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { d = null; }
  if (!d) { syncCreditInputs(); return; }
  for (const k of ["hours", "minutes", "until", "opKeep", "edKeep", "speed", "pause"]) {
    if (d[k] != null) els[k].value = d[k];
  }
  for (const k of ["skipOp", "skipEd", "skipFillers", "staySeason"]) {
    if (typeof d[k] === "boolean") els[k].checked = d[k];
  }
  if (d.mode === "until") {
    els.form.querySelector('input[name="mode"][value="until"]').checked = true;
    els.durationBox.hidden = true;
    els.untilBox.hidden = false;
    refreshUntilHint();
  }
  syncCreditInputs();
  const a = typeof d.anime === "string" ? CATALOG.find((x) => x.id === d.anime) : d.anime;
  if (a && a.versions) {
    const keepFillers = d.skipFillers;
    pickAnime(a, { version: Number(d.version) || 0, season: Number(d.season) || 0, episode: d.episode });
    if (keepFillers && !els.fillerField.hidden) els.skipFillers.checked = true;
  }
}

restore();
