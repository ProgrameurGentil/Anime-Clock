"use strict";

// Sauvegarde du formulaire dans le navigateur, pour le retrouver à la visite suivante.

const SAVED_TEXT_FIELDS = ["hours", "minutes", "endTime", "openingsKept", "endingsKept", "playbackSpeed", "pauseMinutes"];
const SAVED_CHECKBOXES = ["skipOpenings", "skipEndings", "skipFillers", "stayInSeason"];

function saveForm() {
  const anime = state.anime;
  const saved = {
    // Un anime du catalogue est retrouvé par son id ; un anime en ligne est gardé en entier.
    anime: anime ? (anime.isOnline ? anime : anime.id) : null,
    versionIndex: Number(dom.version.value) || 0,
    seasonIndex: currentSeasonIndex(),
    startEpisode: dom.startEpisode.value,
    resumeMinutes: dom.resumeMinutes.value,
    resumeSeconds: dom.resumeSeconds.value,
    timeMode: timeMode()
  };
  for (const name of SAVED_TEXT_FIELDS) saved[name] = dom[name].value;
  for (const name of SAVED_CHECKBOXES) saved[name] = dom[name].checked;
  writeStorage(STORAGE_KEYS.form, JSON.stringify(saved));
}

function restoreForm() {
  removeStorage(STORAGE_KEYS.legacyForm);
  let saved = null;
  try { saved = JSON.parse(readStorage(STORAGE_KEYS.form)); } catch { saved = null; }
  if (!saved) return;

  for (const name of SAVED_TEXT_FIELDS) if (saved[name] != null) dom[name].value = saved[name];
  for (const name of SAVED_CHECKBOXES) if (typeof saved[name] === "boolean") dom[name].checked = saved[name];
  if (saved.timeMode === "endTime") setTimeMode("endTime");

  const anime = typeof saved.anime === "string" ? CATALOG.find((entry) => entry.id === saved.anime) : saved.anime;
  if (anime && Array.isArray(anime.versions)) {
    selectAnime(anime, saved);
    // selectAnime décoche « fillers » quand la version n'en a pas ; on remet le choix enregistré sinon.
    if (saved.skipFillers && !dom.fillerField.hidden) dom.skipFillers.checked = true;
  }
}
