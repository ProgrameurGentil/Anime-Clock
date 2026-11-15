"use strict";

// Calcul : combien d'épisodes tiennent dans le temps disponible.

/**
 * Épisodes à regarder dans l'ordre, à partir de l'épisode de départ.
 * Passe à la saison suivante sauf si stayInSeason, saute les fillers si la case est cochée.
 * Les durées saisies à la main (champ « touched ») remplacent celles du catalogue.
 */
function* upcomingEpisodes({ stayInSeason }) {
  const version = currentVersion();
  const startSeasonIndex = currentSeasonIndex();
  const fillers = dom.skipFillers.checked ? parseEpisodeRanges(version.fillers) : new Set();
  const startEpisode = Math.round(readNumber(dom.startEpisode, 0));
  const manualTiming = {
    duration: dom.episodeDuration.dataset.touched ? readNumber(dom.episodeDuration) * 60 : null,
    opening: dom.openingDuration.dataset.touched ? readNumber(dom.openingDuration) : null,
    ending: dom.endingDuration.dataset.touched ? readNumber(dom.endingDuration) : null
  };

  for (let seasonIndex = startSeasonIndex; seasonIndex < version.seasons.length; seasonIndex++) {
    const season = version.seasons[seasonIndex];
    const timing = seasonTiming(version, season);
    const firstEpisode = seasonIndex === startSeasonIndex && startEpisode ? startEpisode : season.firstEpisode;
    for (let number = firstEpisode; number <= lastEpisodeOf(season); number++) {
      if (fillers.has(number)) continue;
      yield {
        number,
        seasonName: season.name,
        seasonIndex,
        duration: manualTiming.duration ?? timing.duration,
        opening: manualTiming.opening ?? timing.opening,
        ending: manualTiming.ending ?? timing.ending
      };
    }
    if (stayInSeason) return;
  }
}

/** Réglages de la session lus dans le formulaire. Durées en secondes. */
function sessionOptions() {
  return {
    skipOpenings: dom.skipOpenings.checked,
    skipEndings: dom.skipEndings.checked,
    openingsKept: Math.max(0, Math.round(readNumber(dom.openingsKept))),
    endingsKept: Math.max(0, Math.round(readNumber(dom.endingsKept))),
    speed: readNumber(dom.playbackSpeed, 1) || 1,
    pause: Math.max(0, readNumber(dom.pauseMinutes)) * 60
  };
}

/**
 * Temps réel d'un épisode, selon sa place dans la session (0 = premier épisode regardé).
 * Les génériques sont regardés si la case « je saute » est décochée, ou pour les
 * N premiers épisodes quand l'utilisateur veut en garder N.
 */
function episodeCost(episode, indexInSession, options) {
  const watchOpening = !options.skipOpenings || indexInSession < options.openingsKept;
  const watchEnding = !options.skipEndings || indexInSession < options.endingsKept;
  // Un générique ne peut pas dépasser l'épisode (saisie manuelle incohérente).
  const opening = Math.min(episode.opening, episode.duration);
  const ending = Math.min(episode.ending, episode.duration - opening);
  const watched = {
    opening: watchOpening ? opening : 0,
    content: episode.duration - opening - ending,
    ending: watchEnding ? ending : 0
  };
  const watchedSeconds = watched.opening + watched.content + watched.ending;
  return {
    seconds: watchedSeconds / options.speed,
    watched,
    savedSeconds: (episode.duration - watchedSeconds) / options.speed
  };
}

/** Message d'erreur à afficher, ou chaîne vide si le formulaire est valide. */
function validateForm() {
  if (!state.anime) return "Choisis un anime.";
  const season = currentSeason();
  const startEpisode = dom.startEpisode.value.trim();
  if (startEpisode) {
    const number = Number(startEpisode);
    if (!Number.isInteger(number) || number < season.firstEpisode || number > lastEpisodeOf(season)) {
      return `L'épisode doit être entre ${season.firstEpisode} et ${lastEpisodeOf(season)} pour « ${season.name} ».`;
    }
  }
  if (readNumber(dom.episodeDuration) <= 0) return "La durée d'un épisode doit être positive.";
  if (availableSeconds() <= 0) return "Indique un temps disponible.";
  return "";
}

/** Planifie la session à partir de maintenant. Ne touche pas à la page. */
function planSession(now) {
  const options = sessionOptions();
  const available = availableSeconds(now);
  const stayInSeason = dom.stayInSeason.checked;

  const watched = [];   // { episode, cost, startsAfter } ; startsAfter en secondes depuis maintenant
  let usedSeconds = 0;
  let savedSeconds = 0;
  let nextEpisode = null; // premier épisode qui ne tient plus, avec la pause qui le précède
  for (const episode of upcomingEpisodes({ stayInSeason })) {
    const cost = episodeCost(episode, watched.length, options);
    const pauseBefore = watched.length > 0 ? options.pause : 0;
    if (usedSeconds + pauseBefore + cost.seconds > available) {
      nextEpisode = { episode, cost, pauseBefore };
      break;
    }
    usedSeconds += pauseBefore;
    watched.push({ episode, cost, startsAfter: usedSeconds });
    usedSeconds += cost.seconds;
    savedSeconds += cost.savedSeconds;
  }

  // Temps pour finir la saison de départ et la série, au même rythme.
  const remaining = { season: { seconds: 0, episodes: 0 }, series: { seconds: 0, episodes: 0 } };
  let indexInSession = 0;
  for (const episode of upcomingEpisodes({ stayInSeason: false })) {
    const seconds = episodeCost(episode, indexInSession, options).seconds + (indexInSession > 0 ? options.pause : 0);
    remaining.series.seconds += seconds;
    remaining.series.episodes++;
    if (episode.seasonIndex === currentSeasonIndex()) {
      remaining.season.seconds += seconds;
      remaining.season.episodes++;
    }
    indexInSession++;
  }

  return { now, available, usedSeconds, savedSeconds, watched, nextEpisode, remaining, stayInSeason };
}

/** Valide, calcule et affiche. Renvoie false si le formulaire est invalide. */
function calculate() {
  const error = validateForm();
  dom.formError.textContent = error;
  if (error) return false;
  renderResult(planSession(new Date()));
  saveForm();
  return true;
}
