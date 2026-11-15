"use strict";

// Fonctions utilitaires sans lien avec la page : texte, nombres, dates, stockage.

/** Minuscules sans accents, pour comparer des titres (« Frièren » → « frieren »). */
function normalizeText(text) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** « 26,97,101-106 » → Set {26, 97, 101, 102, …, 106}. Chaîne vide ou absente → Set vide. */
function parseEpisodeRanges(rangeList) {
  const episodes = new Set();
  if (!rangeList) return episodes;
  for (const range of rangeList.split(",")) {
    const [start, end] = range.split("-").map(Number);
    for (let episode = start; episode <= (end || start); episode++) episodes.add(episode);
  }
  return episodes;
}

/** 45 → « 45 s », 1500 → « 25 min », 5400 → « 1 h 30 ». */
function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.round(seconds));
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${hours} h`;
}

/** Heure au format « 21:05 ». */
function formatClock(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

/** Valeur numérique d'un champ, virgule acceptée. Champ vide ou invalide → fallback. */
function readNumber(input, fallback = 0) {
  const value = parseFloat(String(input.value).replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
}

function plural(count, singularForm, pluralForm) {
  return count > 1 ? pluralForm : singularForm;
}

/** À appliquer à tout texte venant d'une API ou de l'utilisateur avant de l'insérer en HTML. */
function escapeHtml(text) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (character) => entities[character]);
}

// localStorage peut être absent ou bloqué (navigation privée, aperçu…) : le site marche sans.
function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* réglage non mémorisé */ }
}

function removeStorage(key) {
  try { localStorage.removeItem(key); } catch { /* rien à faire */ }
}

/* ---------- Catalogue ---------- */

function lastEpisodeOf(season) {
  return season.firstEpisode + season.episodes - 1;
}

function totalEpisodesOf(version) {
  return version.seasons.reduce((sum, season) => sum + season.episodes, 0);
}

/** Durées d'une saison, avec repli sur celles de la version. */
function seasonTiming(version, season) {
  return {
    duration: season.duration ?? version.duration,
    opening: season.opening ?? version.opening,
    ending: season.ending ?? version.ending
  };
}
