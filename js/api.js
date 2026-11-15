"use strict";

// Appels aux services externes : AniList (principal), Jikan / MyAnimeList (secours),
// Google Translate (synopsis). Chaque fonction lève une erreur si le service ne répond pas.

const ANILIST_FORMAT_LABELS = {
  TV: "TV", TV_SHORT: "TV court", MOVIE: "Film", OVA: "OVA", ONA: "ONA", SPECIAL: "Spécial"
};

/** Requête GraphQL AniList. Renvoie `data`, ou null si la fiche n'existe pas (404). */
async function aniListQuery(query, variables, signal) {
  const response = await fetch(API_URLS.aniList, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`AniList : HTTP ${response.status}`);
  return (await response.json()).data;
}

/*
 * Les deux recherches renvoient des résultats au même format :
 * { source, id, title, format, year, episodes, releasedEpisodes, durationSeconds }
 * episodes = total prévu (null si inconnu), releasedEpisodes = épisodes déjà sortis (null si inconnu).
 */

async function searchAniList(text, signal) {
  const query = `query($search: String) {
    Page(perPage: ${SEARCH.remoteLimit}) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
        id title { romaji english } format episodes duration seasonYear nextAiringEpisode { episode }
      }
    }
  }`;
  const data = await aniListQuery(query, { search: text }, signal);
  const media = (data && data.Page.media) || [];
  return media.map((entry) => ({
    source: "AniList",
    id: "al-" + entry.id,
    title: entry.title.english || entry.title.romaji,
    format: ANILIST_FORMAT_LABELS[entry.format] || entry.format,
    year: entry.seasonYear,
    episodes: entry.episodes,
    releasedEpisodes: entry.nextAiringEpisode ? entry.nextAiringEpisode.episode - 1 : null,
    durationSeconds: (entry.duration || 0) * 60
  }));
}

async function searchJikan(text, signal) {
  const url = `${API_URLS.jikan}?limit=${SEARCH.remoteLimit}&sfw=true&order_by=members&sort=desc&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Jikan : HTTP ${response.status}`);
  const entries = (await response.json()).data || [];
  return entries.map((entry) => ({
    source: "MyAnimeList",
    id: "mal-" + entry.mal_id,
    title: entry.title_english || entry.title,
    format: entry.type,
    year: entry.year || (entry.aired && entry.aired.prop && entry.aired.prop.from.year),
    episodes: entry.episodes,
    releasedEpisodes: null,
    durationSeconds: parseJikanDuration(entry.duration)
  }));
}

/** Jikan donne la durée en texte : « 24 min per ep », « 1 hr 47 min ». */
function parseJikanDuration(label) {
  if (!label) return 0;
  const hours = /(\d+)\s*hr/.exec(label);
  const minutes = /(\d+)\s*min/.exec(label);
  const seconds = /(\d+)\s*sec/.exec(label);
  return (hours ? Number(hours[1]) * 3600 : 0) + (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0);
}

/**
 * Fiche AniList complète d'un anime. Un anime trouvé sur AniList est cherché par son id,
 * un anime du catalogue par son titre de recherche (version, puis anime, puis titre affiché).
 */
async function fetchAniListDetails(anime, version) {
  const query = `query($id: Int, $search: String) {
    Media(id: $id, search: $search, type: ANIME) {
      id siteUrl title { romaji english native } coverImage { large extraLarge }
      description(asHtml: false) genres averageScore status startDate { year }
      studios(isMain: true) { nodes { name } }
    }
  }`;
  const variables = anime.id.startsWith("al-")
    ? { id: Number(anime.id.slice(3)) }
    : { search: version.search || anime.search || anime.title };
  const data = await aniListQuery(query, variables);
  return (data && data.Media) || null;
}

/* ---------- Traduction ---------- */

/** Découpe un texte en morceaux d'au plus TRANSLATION_CHUNK_SIZE caractères, sans couper une phrase. */
function splitForTranslation(text) {
  const pieces = text
    .split(/(?<=\n)/)
    .flatMap((paragraph) => (paragraph.length > TRANSLATION_CHUNK_SIZE ? paragraph.split(/(?<=[.!?] )/) : [paragraph]));
  const chunks = [];
  let currentChunk = "";
  for (const piece of pieces) {
    if (currentChunk && currentChunk.length + piece.length > TRANSLATION_CHUNK_SIZE) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += piece;
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

async function translateToFrench(text) {
  let translated = "";
  for (const chunk of splitForTranslation(text)) {
    const response = await fetch(API_URLS.translate + encodeURIComponent(chunk));
    if (!response.ok) throw new Error(`Traduction : HTTP ${response.status}`);
    const sentences = (await response.json())[0]; // [[texte traduit, texte source, …], …]
    translated += sentences.map((sentence) => sentence[0]).join("");
  }
  return translated;
}
