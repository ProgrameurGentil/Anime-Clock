"use strict";

// Réglages globaux et état partagé d'Anime Clock.
//
// Les scripts de js/ sont chargés dans l'ordre fixé par index.html et partagent la portée
// globale. Pas de modules ES : le site doit aussi marcher en ouvrant index.html directement
// (file://), où les navigateurs bloquent les imports.

const STORAGE_KEYS = {
  form: "anime-clock:form:v2",              // réglages du formulaire
  legacyForm: "anime-clock:v1",             // ancien format, supprimé au démarrage
  theme: "anime-clock:theme",               // "auto" | "light" | "dark" (lu aussi dans <head>)
  synopsisLanguage: "anime-clock:synopsis-lang", // "fr" | "original"
  translationPrefix: "anime-clock:fr:"      // + id AniList → synopsis traduit
};

const SEARCH = {
  minChars: 3,        // recherche en ligne à partir de 3 caractères
  debounceMs: 350,    // attente après la dernière frappe avant d'interroger l'API
  timeoutMs: 8000,    // au-delà, la recherche en ligne est déclarée indisponible
  catalogLimit: 8,    // suggestions du catalogue affichées
  remoteLimit: 6      // résultats en ligne demandés
};

// Valeurs prises pour un anime trouvé en ligne quand l'API ne donne pas l'info.
const REMOTE_DEFAULTS = { duration: 1440, credits: 90, episodes: 12 };
const NO_CREDITS_BELOW_SECONDS = 600; // un épisode de moins de 10 min n'a pas de générique compté

const END_TIME_REFRESH_MS = 30000;     // mise à jour du mode « heure de fin »
const EPISODE_LIST = { max: 30, head: 15, tail: 5 }; // au-delà de max, on montre le début et la fin
const MIN_SAVED_SECONDS_SHOWN = 30;    // en dessous, on n'affiche pas le temps gagné sur les génériques
const MIN_NEXT_EPISODE_PERCENT = 10;   // en dessous, on ne parle pas du bout d'épisode visible

const API_URLS = {
  aniList: "https://graphql.anilist.co",
  jikan: "https://api.jikan.moe/v4/anime",
  // Service public de Google Translate : gratuit, sans clé, sans garantie de disponibilité.
  translate: "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q="
};
const TRANSLATION_CHUNK_SIZE = 1500; // caractères par requête, pour garder une URL courte

// État de la page.
const state = {
  anime: null,          // anime sélectionné, au format du catalogue
  hasCalculated: false  // après un premier calcul, le résultat suit chaque modification
};
