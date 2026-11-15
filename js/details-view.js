"use strict";

// Onglet « Détails de l'anime » : infos locales, fiche AniList, synopsis traduit, affiche en grand.

const ANILIST_STATUS_LABELS = {
  FINISHED: "Terminé", RELEASING: "En cours", NOT_YET_RELEASED: "À venir",
  CANCELLED: "Annulé", HIATUS: "En pause"
};

const aniListCache = new Map(); // `${anime.id}:${version.id}` → fiche AniList, ou null si introuvable
let displayedFiche = null;      // fiche AniList affichée en ce moment (utile au synopsis)

const detailsCacheKey = () => `${state.anime.id}:${currentVersion().id}`;

/** Description AniList (avec <br>, <i>…) → texte brut. */
function plainDescription(description) {
  if (!description) return "";
  const container = document.createElement("div");
  container.innerHTML = description.replace(/<br\s*\/?>/gi, "\n");
  return container.textContent.replace(/\n{3,}/g, "\n\n").trim();
}

/** Titres natif et romaji, sans répéter le titre affiché (One Piece = ONE PIECE). */
function originalTitles(fiche, displayedTitle) {
  if (!fiche || !fiche.title) return "";
  const seen = new Set([normalizeText(displayedTitle)]);
  return [fiche.title.native, fiche.title.romaji]
    .filter((title) => {
      if (!title || seen.has(normalizeText(title))) return false;
      seen.add(normalizeText(title));
      return true;
    })
    .join(" · ");
}

/** Cases d'infos : [icône, libellé, valeur]. */
function detailFacts(version, fiche) {
  const options = sessionOptions();
  const totalEpisodes = totalEpisodesOf(version);
  let fullSeconds = 0;
  let withoutCreditsSeconds = 0;
  for (const season of version.seasons) {
    const timing = seasonTiming(version, season);
    const skipped = (options.skipOpenings ? timing.opening : 0) + (options.skipEndings ? timing.ending : 0);
    fullSeconds += season.episodes * timing.duration;
    withoutCreditsSeconds += season.episodes * (timing.duration - skipped);
  }

  const facts = [
    ["fa-film", "Épisodes", state.anime.hasUnknownEpisodeCount ? `${totalEpisodes} sortis` : String(totalEpisodes)],
    ["fa-clock", "Tout voir", formatDuration(fullSeconds)],
    ["fa-forward", "Sans génériques", formatDuration(withoutCreditsSeconds)]
  ];
  const fillerCount = parseEpisodeRanges(version.fillers).size;
  if (fillerCount) facts.push(["fa-filter", "Fillers", `${fillerCount} ép.`]);
  if (state.anime.versions.length > 1) {
    facts.push(["fa-code-branch", "Versions", state.anime.versions.map((item) => item.label).join(", ")]);
  }
  if (fiche) {
    if (fiche.status) facts.push(["fa-signal", "Statut", ANILIST_STATUS_LABELS[fiche.status] || fiche.status]);
    if (fiche.startDate && fiche.startDate.year) facts.push(["fa-calendar", "Première diffusion", String(fiche.startDate.year)]);
    const studios = fiche.studios ? fiche.studios.nodes.map((studio) => studio.name) : [];
    if (studios.length) facts.push(["fa-building", "Studio", studios.join(", ")]);
    if (fiche.averageScore) facts.push(["fa-star", "Note AniList", `${fiche.averageScore} / 100`]);
  }
  return facts;
}

function seasonsTable(version) {
  if (version.seasons.length < 2) return "";
  const rows = version.seasons.map((season) => {
    const range = season.episodes > 1 ? `${season.firstEpisode}–${lastEpisodeOf(season)}` : season.firstEpisode;
    const seconds = season.episodes * seasonTiming(version, season).duration;
    return `<tr><td>${escapeHtml(season.name)}</td><td>${range}</td><td>${formatDuration(seconds)}</td></tr>`;
  }).join("");
  return `<table class="seasons-table">
    <thead><tr><th>Saison / arc</th><th>Épisodes</th><th>Durée</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/** Affiche la fiche. `fiche` = données AniList ou null ; `statusMessage` = texte en bas (chargement, erreur). */
function renderDetails(fiche, statusMessage = "") {
  if (!state.anime) return;
  displayedFiche = fiche;
  const version = currentVersion();
  const title = state.anime.title;

  const cover = fiche && fiche.coverImage
    ? `<button type="button" class="cover-button" id="coverButton" aria-label="Agrandir l'affiche">
         <img src="${escapeHtml(fiche.coverImage.large)}" alt="Affiche de ${escapeHtml(title)}" loading="lazy">
       </button>`
    : "";
  const originals = originalTitles(fiche, title);
  const genres = fiche && fiche.genres && fiche.genres.length
    ? `<ul class="tags">${fiche.genres.map((genre) => `<li>${escapeHtml(genre)}</li>`).join("")}</ul>`
    : "";
  const facts = detailFacts(version, fiche).map(([icon, label, value]) => `
    <div><dt><i class="fa-solid ${icon}" aria-hidden="true"></i>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
  const source = statusMessage || (fiche && fiche.siteUrl
    ? `Affiche, synopsis et note : <a href="${escapeHtml(fiche.siteUrl)}" target="_blank" rel="noopener">fiche AniList</a>.`
    : "");

  dom.details.innerHTML = `
    <div class="details-head">
      ${cover}
      <div>
        <h3>${escapeHtml(title)}</h3>
        ${originals ? `<p class="original-titles">${escapeHtml(originals)}</p>` : ""}
        ${genres}
      </div>
    </div>
    <dl class="facts">${facts}</dl>
    <div id="synopsis"></div>
    ${seasonsTable(version)}
    <p class="source-note">${source}</p>
  `;

  const coverButton = byId("coverButton");
  if (coverButton) {
    coverButton.addEventListener("click", () => openCover(fiche.coverImage.extraLarge || fiche.coverImage.large, title));
  }
  renderSynopsis();
}

/** Charge la fiche AniList (une seule requête par anime et version) puis l'affiche. */
async function loadDetails() {
  if (!state.anime) return;
  if (state.anime.isManual) { renderDetails(null); return; }

  const requestedAnime = state.anime;
  const cacheKey = detailsCacheKey();
  if (aniListCache.has(cacheKey)) { renderDetails(aniListCache.get(cacheKey)); return; }

  renderDetails(null, "Chargement des infos AniList…");
  const stillDisplayed = () => state.anime === requestedAnime && detailsCacheKey() === cacheKey;
  try {
    const fiche = await fetchAniListDetails(requestedAnime, currentVersion());
    aniListCache.set(cacheKey, fiche);
    if (stillDisplayed()) renderDetails(fiche, fiche ? "" : "Pas de fiche AniList trouvée.");
  } catch {
    if (stillDisplayed()) renderDetails(null, "AniList ne répond pas, seules les infos locales sont affichées.");
  }
}

/** Après un changement du formulaire : requête seulement si l'onglet est ouvert. */
function refreshDetails() {
  if (!state.anime) return;
  if (isDetailsTabOpen()) loadDetails();
  else renderDetails(aniListCache.get(detailsCacheKey()) || null);
}

/* ---------- Synopsis : français ou original ---------- */

const translations = new Map(); // id AniList → { status: "loading" | "done" | "failed", text }
let synopsisLanguage = readStorage(STORAGE_KEYS.synopsisLanguage) === "original" ? "original" : "fr";

/** Traduit le synopsis une seule fois (mémoire, puis localStorage) et réaffiche si besoin. */
async function ensureTranslation(ficheId, originalText) {
  if (translations.has(ficheId)) return;
  const stored = readStorage(STORAGE_KEYS.translationPrefix + ficheId);
  if (stored) { translations.set(ficheId, { status: "done", text: stored }); return; }

  translations.set(ficheId, { status: "loading" });
  try {
    const translated = await translateToFrench(originalText);
    translations.set(ficheId, { status: "done", text: translated });
    writeStorage(STORAGE_KEYS.translationPrefix + ficheId, translated);
  } catch {
    translations.set(ficheId, { status: "failed" });
  }
  if (displayedFiche && displayedFiche.id === ficheId) renderSynopsis();
}

function renderSynopsis() {
  const container = byId("synopsis");
  if (!container) return;
  const original = displayedFiche ? plainDescription(displayedFiche.description) : "";
  if (!original) { container.innerHTML = ""; return; }

  let text = original;
  let note = "";
  if (synopsisLanguage === "fr") {
    const translation = translations.get(displayedFiche.id);
    if (!translation) ensureTranslation(displayedFiche.id, original);
    if (translation && translation.status === "done") {
      text = translation.text;
      note = "Traduction automatique.";
    } else if (translation && translation.status === "failed") {
      note = "Traduction indisponible, texte original affiché.";
    } else {
      note = "Traduction en cours…";
    }
  }

  container.innerHTML = `
    <div class="synopsis-head">
      <h4>Synopsis</h4>
      <div class="language-toggle" role="group" aria-label="Langue du synopsis">
        <button type="button" data-language="fr" aria-pressed="${synopsisLanguage === "fr"}">Français</button>
        <button type="button" data-language="original" aria-pressed="${synopsisLanguage === "original"}">Original</button>
      </div>
    </div>
    <p class="synopsis">${escapeHtml(text)}</p>
    ${note ? `<p class="synopsis-note">${note}</p>` : ""}
  `;
  container.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => {
    synopsisLanguage = button.dataset.language;
    writeStorage(STORAGE_KEYS.synopsisLanguage, synopsisLanguage);
    renderSynopsis();
  }));
}

/* ---------- Affiche en grand ---------- */

function openCover(imageUrl, title) {
  dom.coverImage.src = imageUrl;
  dom.coverImage.alt = `Affiche de ${title}`;
  dom.coverModal.showModal();
}

function initCoverModal() {
  // Échap ferme le <dialog> nativement. Un clic n'importe où (croix, image, fond) le ferme aussi.
  dom.coverModal.addEventListener("click", () => dom.coverModal.close());
  dom.coverModal.addEventListener("close", () => dom.coverImage.removeAttribute("src"));
}
