"use strict";

// Champ de recherche : suggestions du catalogue, recherche en ligne, saisie manuelle.

const suggestionList = {
  items: [],        // { element, choose } dans l'ordre affiché
  activeIndex: -1   // suggestion surlignée au clavier
};

const remoteSearch = {
  controller: null, // AbortController de la requête en cours
  timer: null,      // anti-rebond
  results: [],
  status: "idle"    // "idle" | "loading" | "done" | "failed"
};

function catalogMatches(query) {
  const needle = normalizeText(query.trim());
  if (!needle) return CATALOG.slice(0, SEARCH.catalogLimit);
  return CATALOG
    .filter((anime) => normalizeText(`${anime.title} ${anime.alt || ""}`).includes(needle))
    .slice(0, SEARCH.catalogLimit);
}

function renderSuggestions(query) {
  const typed = query.trim();
  const list = dom.suggestions;
  list.innerHTML = "";
  suggestionList.items = [];
  suggestionList.activeIndex = -1;

  const addGroupTitle = (label) => {
    const element = document.createElement("li");
    element.className = "suggestion-group";
    element.setAttribute("role", "presentation");
    element.textContent = label;
    list.appendChild(element);
  };
  const addOption = (label, meta, choose) => {
    const element = document.createElement("li");
    element.setAttribute("role", "option");
    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    const metaSpan = document.createElement("span");
    metaSpan.className = "suggestion-meta";
    metaSpan.textContent = meta;
    element.append(labelSpan, metaSpan);
    // mousedown plutôt que click : le champ perdrait le focus (et fermerait la liste) avant le click.
    element.addEventListener("mousedown", (event) => { event.preventDefault(); choose(); });
    list.appendChild(element);
    suggestionList.items.push({ element, choose });
  };

  const catalogResults = catalogMatches(query);
  if (catalogResults.length) {
    addGroupTitle("Catalogue");
    for (const anime of catalogResults) {
      const meta = anime.versions.length > 1
        ? `${anime.versions.length} versions`
        : `${totalEpisodesOf(anime.versions[0])} ép.`;
      addOption(anime.title, meta, () => selectAnime(anime));
    }
  }

  // Les résultats en ligne déjà présents dans le catalogue ne sont pas répétés.
  const catalogTitles = new Set(catalogResults.map((anime) => normalizeText(anime.title)));
  const onlineResults = remoteSearch.results.filter((result) => !catalogTitles.has(normalizeText(result.title)));
  const longEnough = typed.length >= SEARCH.minChars;
  if (onlineResults.length) {
    addGroupTitle(`En ligne (${onlineResults[0].source})`);
    for (const result of onlineResults) {
      const episodes = result.episodes
        ? `${result.episodes} ép.`
        : result.releasedEpisodes ? `${result.releasedEpisodes} ép. sortis` : "en cours";
      const meta = [result.format, result.year, episodes].filter(Boolean).join(" · ");
      addOption(result.title, meta, () => selectAnime(animeFromSearchResult(result)));
    }
  } else if (longEnough) {
    const statusLabels = {
      loading: "En ligne : recherche…",
      failed: "Recherche en ligne indisponible",
      done: "En ligne : aucun résultat"
    };
    if (statusLabels[remoteSearch.status]) addGroupTitle(statusLabels[remoteSearch.status]);
  }

  if (typed && !catalogResults.some((anime) => normalizeText(anime.title) === normalizeText(typed))) {
    addGroupTitle("Pas dans la liste ?");
    addOption(`« ${typed} »`, "saisie manuelle", () => selectAnime(manualAnime(typed)));
  }

  list.hidden = list.children.length === 0;
  dom.search.setAttribute("aria-expanded", String(!list.hidden));
}

function closeSuggestions() {
  dom.suggestions.hidden = true;
  dom.search.setAttribute("aria-expanded", "false");
}

/** Lance la recherche en ligne après l'anti-rebond : AniList d'abord, Jikan si AniList échoue. */
function startRemoteSearch(query) {
  clearTimeout(remoteSearch.timer);
  if (remoteSearch.controller) remoteSearch.controller.abort();
  remoteSearch.controller = null;
  remoteSearch.results = [];
  remoteSearch.status = "idle";
  const text = query.trim();
  if (text.length < SEARCH.minChars) return;

  remoteSearch.timer = setTimeout(async () => {
    const controller = new AbortController();
    remoteSearch.controller = controller;
    remoteSearch.status = "loading";
    renderSuggestions(dom.search.value);

    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, SEARCH.timeoutMs);
    try {
      try {
        remoteSearch.results = await searchAniList(text, controller.signal);
      } catch (error) {
        if (error.name === "AbortError") throw error;
        remoteSearch.results = await searchJikan(text, controller.signal);
      }
      remoteSearch.status = "done";
    } catch (error) {
      // Annulée par une frappe plus récente : cette recherche ne doit plus rien afficher.
      if (error.name === "AbortError" && !timedOut) return;
      remoteSearch.results = [];
      remoteSearch.status = "failed";
    } finally {
      clearTimeout(timeout);
    }
    if (remoteSearch.controller !== controller) return;
    remoteSearch.controller = null;
    if (document.activeElement === dom.search) renderSuggestions(dom.search.value);
  }, SEARCH.debounceMs);
}

function highlightSuggestion(step) {
  const items = suggestionList.items;
  if (!items.length) return;
  suggestionList.activeIndex = (suggestionList.activeIndex + step + items.length) % items.length;
  items.forEach((item, index) => item.element.setAttribute("aria-selected", String(index === suggestionList.activeIndex)));
  items[suggestionList.activeIndex].element.scrollIntoView({ block: "nearest" });
}

function initSearch() {
  dom.search.addEventListener("input", () => {
    renderSuggestions(dom.search.value);
    startRemoteSearch(dom.search.value);
  });
  dom.search.addEventListener("focus", () => {
    dom.search.select();
    renderSuggestions("");
  });
  dom.search.addEventListener("blur", () => {
    closeSuggestions();
    if (state.anime) dom.search.value = state.anime.title;
  });
  dom.search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightSuggestion(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightSuggestion(-1);
    } else if (event.key === "Enter") {
      const items = suggestionList.items;
      if (dom.suggestions.hidden || !items.length) return;
      event.preventDefault();
      items[Math.max(suggestionList.activeIndex, 0)].choose();
    } else if (event.key === "Escape") {
      dom.search.blur();
    }
  });
}
