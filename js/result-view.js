"use strict";

// Affichage du résultat dans l'onglet Calcul.

function renderResult(plan) {
  const { now, available, usedSeconds, savedSeconds, watched, nextEpisode, remaining } = plan;
  const anime = state.anime;
  const version = currentVersion();
  const watchedCount = watched.length;
  const leftoverSeconds = available - usedSeconds;
  const spansSeveralSeasons = new Set(watched.map((item) => item.episode.seasonIndex)).size > 1;
  // Temps qu'il faudrait en plus pour voir l'épisode suivant en entier.
  const missingForNext = nextEpisode ? nextEpisode.cost.seconds + nextEpisode.pauseBefore - leftoverSeconds : 0;

  const title = anime.versions.length > 1 ? `${anime.title} · ${version.label}` : anime.title;

  dom.result.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    <div class="result-count"><strong>${watchedCount}</strong><span>${plural(watchedCount, "épisode", "épisodes")}</span></div>
    <p class="result-range">${escapeHtml(describeRange(watched, nextEpisode, missingForNext, spansSeveralSeasons))}</p>
    ${renderStats(plan, leftoverSeconds, missingForNext)}
    ${watchedCount ? `
      ${renderTimeline(watched, nextEpisode, leftoverSeconds, available)}
      <ul class="episode-list">${renderEpisodeList(watched, now, spansSeveralSeasons)}</ul>` : ""}
    ${renderNotes(plan, leftoverSeconds)}
  `;
}

/** Phrase sous le nombre : quels épisodes, ou ce qu'il manque pour en voir un. */
function describeRange(watched, nextEpisode, missingForNext, spansSeveralSeasons) {
  if (watched.length === 0) {
    return nextEpisode
      ? `Il te manque ${formatDuration(missingForNext)} pour voir l'épisode ${nextEpisode.episode.number} en entier.`
      : "Il n'y a plus d'épisode à partir de ce point.";
  }
  const first = watched[0].episode;
  const last = watched[watched.length - 1].episode;
  if (watched.length === 1) return `L'épisode ${first.number} · ${first.seasonName}`;
  return spansSeveralSeasons
    ? `De l'épisode ${first.number} (${first.seasonName}) à l'épisode ${last.number} (${last.seasonName})`
    : `Du ${first.number} au ${last.number} · ${first.seasonName}`;
}

function renderStats(plan, leftoverSeconds, missingForNext) {
  const { now, usedSeconds, savedSeconds, watched, nextEpisode } = plan;
  const stats = []; // [valeur, libellé, icône]
  if (watched.length) stats.push([formatClock(addSeconds(now, usedSeconds)), "fin si tu lances maintenant", "fa-flag-checkered"]);
  stats.push([formatDuration(leftoverSeconds), "de marge", "fa-hourglass-end"]);
  if (nextEpisode && watched.length) stats.push([formatDuration(missingForNext), "manquent pour un épisode de plus", "fa-plus"]);
  if (savedSeconds >= MIN_SAVED_SECONDS_SHOWN) stats.push([formatDuration(savedSeconds), "gagnées sur les génériques", "fa-forward"]);

  const cards = stats.map(([value, label, icon]) => `
    <div class="stat">
      <b><i class="fa-solid ${icon}" aria-hidden="true"></i>${value}</b>
      <small>${label}</small>
    </div>`).join("");
  return `<div class="stats">${cards}</div>`;
}

/** Frise proportionnelle : un bloc par épisode (intro, épisode, outro), puis la marge. */
function renderTimeline(watched, nextEpisode, leftoverSeconds, available) {
  const percentOf = (part, whole) => (part / whole) * 100;
  let blocks = "";
  for (const { episode, cost } of watched) {
    const { opening, content, ending } = cost.watched;
    const watchedTotal = opening + content + ending;
    blocks += `<div class="timeline-episode" style="width:${percentOf(cost.seconds, available)}%" title="Épisode ${episode.number} · ${formatDuration(cost.seconds)}">`
      + (opening ? `<div class="segment-opening" style="width:${percentOf(opening, watchedTotal)}%"></div>` : "")
      + `<div class="segment-content"></div>`
      + (ending ? `<div class="segment-ending" style="width:${percentOf(ending, watchedTotal)}%"></div>` : "")
      + `</div>`;
  }
  if (nextEpisode && leftoverSeconds > 0) {
    blocks += `<div class="timeline-margin" style="width:${percentOf(leftoverSeconds, available)}%" title="Marge"></div>`;
  }
  return `
    <div class="timeline" aria-hidden="true">${blocks}</div>
    <div class="legend">
      <span><i class="legend-opening"></i>Intro</span>
      <span><i class="legend-content"></i>Épisode</span>
      <span><i class="legend-ending"></i>Outro</span>
      <span><i class="timeline-margin legend-margin"></i>Marge</span>
    </div>`;
}

/** Liste avec l'heure de début de chaque épisode. Longue liste : début et fin seulement. */
function renderEpisodeList(watched, now, spansSeveralSeasons) {
  const row = ({ episode, cost, startsAfter }) => {
    const seasonTag = spansSeveralSeasons ? `<span class="season-tag">${escapeHtml(episode.seasonName)}</span>` : "";
    return `<li><span>Épisode ${episode.number}${seasonTag}</span>`
      + `<time>${formatClock(addSeconds(now, startsAfter))} · ${formatDuration(cost.seconds)}</time></li>`;
  };
  if (watched.length <= EPISODE_LIST.max) return watched.map(row).join("");
  const hiddenCount = watched.length - EPISODE_LIST.head - EPISODE_LIST.tail;
  return watched.slice(0, EPISODE_LIST.head).map(row).join("")
    + `<li class="episode-list-gap">… ${hiddenCount} épisodes …</li>`
    + watched.slice(-EPISODE_LIST.tail).map(row).join("");
}

function renderNotes(plan, leftoverSeconds) {
  const { available, usedSeconds, watched, nextEpisode, remaining, stayInSeason } = plan;
  const version = currentVersion();
  const notes = []; // HTML déjà sûr : uniquement des nombres et des textes fixes

  if (nextEpisode && watched.length) {
    const percent = Math.floor((Math.max(0, leftoverSeconds - nextEpisode.pauseBefore) / nextEpisode.cost.seconds) * 100);
    if (percent >= MIN_NEXT_EPISODE_PERCENT) {
      notes.push(`Avec la marge, tu verrais ${percent} % de l'épisode ${nextEpisode.episode.number} avant de couper.`);
    }
  }

  if (!nextEpisode && watched.length) {
    notes.push(`<span class="note-done">Tu arrives au bout ${stayInSeason ? "de la saison" : "de la série"}.</span>`);
  } else if (watched.length) {
    const sessionsFor = (seconds) => Math.ceil(seconds / Math.max(available, 1));
    if (remaining.season.seconds > usedSeconds && version.seasons.length > 1) {
      notes.push(`Pour finir la saison : ${formatDuration(remaining.season.seconds)} (${remaining.season.episodes} ép.), soit ${sessionsFor(remaining.season.seconds)} sessions comme celle-ci.`);
    }
    if (remaining.series.seconds > usedSeconds && !stayInSeason) {
      const goal = state.anime.hasUnknownEpisodeCount ? "rattraper les épisodes sortis" : "finir la série";
      notes.push(`Pour ${goal} : ${formatDuration(remaining.series.seconds)} (${remaining.series.episodes} ép.), soit ${sessionsFor(remaining.series.seconds)} sessions comme celle-ci.`);
    }
  }

  if (dom.skipFillers.checked && version.fillers) notes.push("Les fillers sont retirés du compte.");
  return notes.map((note) => `<p class="note">${note}</p>`).join("");
}
