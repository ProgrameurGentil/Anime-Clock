"use strict";

// Choix de l'anime, de la version et de la saison, et réglages qui en découlent.

function currentVersion() {
  return state.anime && state.anime.versions[Number(dom.version.value) || 0];
}

function currentSeasonIndex() {
  return Number(dom.season.value) || 0;
}

function currentSeason() {
  return currentVersion().seasons[currentSeasonIndex()];
}

/** Convertit un résultat de recherche en ligne au format du catalogue. */
function animeFromSearchResult(result) {
  const duration = result.durationSeconds || REMOTE_DEFAULTS.duration;
  const credits = duration >= NO_CREDITS_BELOW_SECONDS ? REMOTE_DEFAULTS.credits : 0;
  const episodes = result.episodes || result.releasedEpisodes || REMOTE_DEFAULTS.episodes;
  return {
    id: result.id,
    title: result.title,
    isOnline: true,
    hasUnknownEpisodeCount: !result.episodes,
    versions: [{
      id: "tv",
      label: result.format || "Série",
      duration,
      opening: credits,
      ending: credits,
      seasons: [{ name: result.title, firstEpisode: 1, episodes }]
    }]
  };
}

/** Anime saisi à la main : l'utilisateur règle le nombre d'épisodes et la durée. */
function manualAnime(title) {
  return {
    id: "manual-" + normalizeText(title).replace(/\W+/g, "-"),
    title,
    isOnline: true,
    isManual: true,
    versions: [{
      id: "tv",
      label: "Série",
      ...STANDARD_TIMING,
      seasons: [{ name: title, firstEpisode: 1, episodes: REMOTE_DEFAULTS.episodes }]
    }]
  };
}

/**
 * Sélectionne un anime et remplit les champs qui en dépendent.
 * `saved` (facultatif) restaure la version, la saison et l'épisode d'une visite précédente.
 */
function selectAnime(anime, saved = {}) {
  state.anime = anime;
  dom.search.value = anime.title;
  closeSuggestions();
  dom.search.blur();

  dom.version.innerHTML = anime.versions
    .map((version, index) => `<option value="${index}">${escapeHtml(version.label)}</option>`)
    .join("");
  const versionIndex = anime.versions[saved.versionIndex] ? saved.versionIndex : 0;
  dom.version.value = String(versionIndex);
  dom.versionField.hidden = anime.versions.length < 2;

  dom.episodeCountField.hidden = !anime.isOnline;
  dom.episodeCountLabel.textContent = anime.hasUnknownEpisodeCount ? "Épisodes sortis" : "Nombre d'épisodes";

  fillSeasonOptions(saved.seasonIndex ?? 0);
  if (saved.startEpisode) dom.startEpisode.value = saved.startEpisode;
  dom.season.disabled = false;
  dom.startEpisode.disabled = false;

  // Réglages à vérifier : on ouvre « Avancé » pour que l'utilisateur les voie.
  if (anime.versions.length > 1 || anime.isManual || anime.hasUnknownEpisodeCount) dom.animeAdvanced.open = true;
  onFormChange();
}

function seasonOptionLabel(season) {
  return season.episodes > 1 ? `${season.name} (${season.firstEpisode}–${lastEpisodeOf(season)})` : season.name;
}

function fillSeasonOptions(seasonIndex = 0) {
  const version = currentVersion();
  dom.season.innerHTML = version.seasons
    .map((season, index) => `<option value="${index}">${escapeHtml(seasonOptionLabel(season))}</option>`)
    .join("");
  dom.season.value = String(version.seasons[seasonIndex] ? seasonIndex : 0);

  dom.fillerField.hidden = !version.fillers;
  if (!version.fillers) dom.skipFillers.checked = false;
  if (state.anime.isOnline) dom.episodeCount.value = version.seasons[0].episodes;
  applySeasonDefaults();
  updateAnimeInfo();
}

/** Remet les durées et la plage d'épisodes de la saison choisie. */
function applySeasonDefaults() {
  const season = currentSeason();
  const timing = seasonTiming(currentVersion(), season);
  dom.episodeDuration.value = Number((timing.duration / 60).toFixed(1));
  dom.openingDuration.value = timing.opening;
  dom.endingDuration.value = timing.ending;
  for (const field of TIMING_OVERRIDE_FIELDS) delete field.dataset.touched;

  dom.startEpisode.min = season.firstEpisode;
  dom.startEpisode.max = lastEpisodeOf(season);
  dom.startEpisode.placeholder = String(season.firstEpisode);
  dom.startEpisode.value = "";
}

/** Ligne de résumé sous le titre : saisons, épisodes, durée, fillers, versions. */
function updateAnimeInfo() {
  const anime = state.anime;
  if (!anime) { dom.animeInfo.textContent = ""; return; }
  if (anime.isManual) {
    dom.animeInfo.textContent = "Saisie manuelle : indique le nombre d'épisodes et leur durée dans Avancé.";
    return;
  }

  const version = currentVersion();
  const total = totalEpisodesOf(version);
  const parts = [];
  if (version.seasons.length > 1) parts.push(`${version.seasons.length} saisons ou arcs`);
  parts.push(anime.hasUnknownEpisodeCount
    ? "série en cours : vérifie le nombre d'épisodes sortis dans Avancé"
    : `${total} ${plural(total, "épisode", "épisodes")}`);
  parts.push(`≈ ${Math.round(version.duration / 60)} min l'épisode`);
  if (version.fillers) parts.push(`${parseEpisodeRanges(version.fillers).size} fillers`);
  if (anime.versions.length > 1) parts.push(`${anime.versions.length} versions (voir Avancé)`);
  if (anime.isOnline) parts.push("génériques estimés");
  dom.animeInfo.textContent = parts.join(" · ");
}

/** Nombre d'épisodes saisi pour un anime en ligne ou manuel (une seule saison). */
function applyEpisodeCount() {
  if (!state.anime || !state.anime.isOnline) return;
  const season = state.anime.versions[0].seasons[0];
  season.episodes = Math.max(1, Math.round(readNumber(dom.episodeCount, 1)));
  dom.startEpisode.max = season.episodes;
  dom.season.options[0].textContent = seasonOptionLabel(season);
}

function initSelection() {
  dom.version.addEventListener("change", () => { fillSeasonOptions(0); onFormChange(); });
  dom.season.addEventListener("change", () => { applySeasonDefaults(); onFormChange(); });
  dom.episodeCount.addEventListener("input", applyEpisodeCount);
  for (const field of TIMING_OVERRIDE_FIELDS) {
    field.addEventListener("input", () => { field.dataset.touched = "true"; });
  }
}
