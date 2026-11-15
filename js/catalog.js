"use strict";

// Catalogue des animes, écrit à la main.
//
// Structure : anime → versions (normale, Kai…) → saisons ou arcs.
// - Durées en secondes : duration = épisode complet, opening = générique de début, ending = générique de fin.
//   Une saison peut redéfinir duration / opening / ending (ex. épisodes spéciaux plus longs).
// - firstEpisode = numéro affiché du premier épisode de la saison. Les séries longues gardent
//   une numérotation absolue (One Piece : Water Seven commence au 207), ce qui permet d'appliquer les fillers.
// - fillers = épisodes hors manga, numérotation absolue, plages séparées par des virgules.
//   Source : listes tenues par les fans, à prendre comme repère.
// - search = titre à chercher sur AniList quand il diffère du titre affiché (sur l'anime ou la version).

const STANDARD_TIMING = { duration: 1420, opening: 90, ending: 90 }; // 23 min 40, génériques de 90 s

const CATALOG = [
  {
    id: "one-piece",
    title: "One Piece",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING, opening: 120,
      fillers: "54-61,98-99,102,131-143,196-206,220-226,279-283,291-292,303,317-319,326-336,382-384,406-407,426-429,457-458,492,542,575-578,590,626-627,747-750,780-782,895-896,907,1029-1030",
      seasons: [
        { name: "East Blue", firstEpisode: 1, episodes: 61 },
        { name: "Alabasta", firstEpisode: 62, episodes: 74 },
        { name: "Skypiea", firstEpisode: 136, episodes: 71 },
        { name: "Water Seven", firstEpisode: 207, episodes: 119 },
        { name: "Thriller Bark", firstEpisode: 326, episodes: 59 },
        { name: "Guerre au sommet", firstEpisode: 385, episodes: 132 },
        { name: "Île des Hommes-Poissons", firstEpisode: 517, episodes: 58 },
        { name: "Dressrosa", firstEpisode: 575, episodes: 172 },
        { name: "Whole Cake Island", firstEpisode: 747, episodes: 145 },
        { name: "Wano", firstEpisode: 892, episodes: 194 },
        { name: "Egghead (jusqu'au 1122)", firstEpisode: 1086, episodes: 37 }
      ]
    }]
  },
  {
    id: "naruto",
    title: "Naruto",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      fillers: "26,97,101-106,136-220",
      seasons: [{ name: "Naruto", firstEpisode: 1, episodes: 220 }]
    }]
  },
  {
    id: "naruto-shippuden",
    title: "Naruto Shippuden",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      fillers: "57-71,90-112,127-133,144-151,170-171,176-196,223-242,257-260,271,279-281,284-295,303-320,347-361,376-377,388-390,394-413,416,422-423,427-450,452-458,460-462,464-469,480-483",
      seasons: [{ name: "Shippuden", firstEpisode: 1, episodes: 500 }]
    }]
  },
  {
    id: "dragon-ball",
    title: "Dragon Ball",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Dragon Ball", firstEpisode: 1, episodes: 153 }] }]
  },
  {
    id: "dragon-ball-z",
    title: "Dragon Ball Z",
    alt: "dbz kai",
    versions: [
      {
        id: "tv", label: "Dragon Ball Z (originale)", ...STANDARD_TIMING,
        seasons: [
          { name: "Saiyans", firstEpisode: 1, episodes: 35 },
          { name: "Namek / Freezer", firstEpisode: 36, episodes: 72 },
          { name: "Garlic Jr.", firstEpisode: 108, episodes: 10 },
          { name: "Cyborgs / Cell", firstEpisode: 118, episodes: 77 },
          { name: "Boo", firstEpisode: 195, episodes: 97 }
        ]
      },
      {
        id: "kai", search: "Dragon Ball Kai", label: "Dragon Ball Z Kai", ...STANDARD_TIMING,
        seasons: [
          { name: "Kai (Saiyans à Cell)", firstEpisode: 1, episodes: 98 },
          { name: "The Final Chapters (Boo)", firstEpisode: 99, episodes: 69 }
        ]
      }
    ]
  },
  {
    id: "dragon-ball-super",
    title: "Dragon Ball Super",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Super", firstEpisode: 1, episodes: 131 }] }]
  },
  {
    id: "bleach",
    title: "Bleach",
    alt: "tybw thousand year blood war",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      fillers: "33,50,64-108,128-137,147-149,168-189,204-205,213-214,227-266,287,298-299,303-305,311-341,355",
      seasons: [
        { name: "Série originale", firstEpisode: 1, episodes: 366 },
        { name: "TYBW partie 1", firstEpisode: 367, episodes: 13 },
        { name: "TYBW partie 2", firstEpisode: 380, episodes: 13 },
        { name: "TYBW partie 3", firstEpisode: 393, episodes: 14 }
      ]
    }]
  },
  {
    id: "hxh",
    title: "Hunter x Hunter",
    versions: [
      { id: "2011", search: "Hunter x Hunter (2011)", label: "Version 2011", ...STANDARD_TIMING, seasons: [{ name: "Hunter x Hunter (2011)", firstEpisode: 1, episodes: 148 }] },
      { id: "1999", search: "Hunter x Hunter", label: "Version 1999", ...STANDARD_TIMING, seasons: [{ name: "Hunter x Hunter (1999)", firstEpisode: 1, episodes: 62 }] }
    ]
  },
  {
    id: "fma",
    title: "Fullmetal Alchemist",
    alt: "brotherhood",
    versions: [
      { id: "fmab", search: "Fullmetal Alchemist: Brotherhood", label: "Brotherhood (2009)", ...STANDARD_TIMING, seasons: [{ name: "Brotherhood", firstEpisode: 1, episodes: 64 }] },
      { id: "fma", search: "Hagane no Renkinjutsushi", label: "Version 2003", ...STANDARD_TIMING, seasons: [{ name: "FMA (2003)", firstEpisode: 1, episodes: 51 }] }
    ]
  },
  {
    id: "aot",
    search: "Shingeki no Kyojin",
    title: "L'Attaque des Titans",
    alt: "attack on titan shingeki no kyojin snk",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 25 },
        { name: "Saison 2", firstEpisode: 1, episodes: 12 },
        { name: "Saison 3 partie 1", firstEpisode: 1, episodes: 12 },
        { name: "Saison 3 partie 2", firstEpisode: 13, episodes: 10 },
        { name: "Saison finale partie 1", firstEpisode: 1, episodes: 16 },
        { name: "Saison finale partie 2", firstEpisode: 17, episodes: 12 },
        { name: "Chapitres finaux (2 spéciaux)", firstEpisode: 1, episodes: 2, duration: 4400, opening: 90, ending: 150 }
      ]
    }]
  },
  {
    id: "demon-slayer",
    search: "Kimetsu no Yaiba",
    title: "Demon Slayer",
    alt: "kimetsu no yaiba",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 26 },
        { name: "Le Train de l'Infini (TV)", firstEpisode: 1, episodes: 7 },
        { name: "Quartier des plaisirs", firstEpisode: 1, episodes: 11 },
        { name: "Village des forgerons", firstEpisode: 1, episodes: 11 },
        { name: "Entraînement des piliers", firstEpisode: 1, episodes: 8 }
      ]
    }]
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 24 },
        { name: "Saison 2", firstEpisode: 25, episodes: 23 }
      ]
    }]
  },
  {
    id: "mha",
    search: "Boku no Hero Academia",
    title: "My Hero Academia",
    alt: "boku no hero academia",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 13 },
        { name: "Saison 2", firstEpisode: 14, episodes: 25 },
        { name: "Saison 3", firstEpisode: 39, episodes: 25 },
        { name: "Saison 4", firstEpisode: 64, episodes: 25 },
        { name: "Saison 5", firstEpisode: 89, episodes: 25 },
        { name: "Saison 6", firstEpisode: 114, episodes: 25 },
        { name: "Saison 7", firstEpisode: 139, episodes: 21 }
      ]
    }]
  },
  {
    id: "death-note",
    title: "Death Note",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Death Note", firstEpisode: 1, episodes: 37 }] }]
  },
  {
    id: "code-geass",
    search: "Code Geass: Hangyaku no Lelouch",
    title: "Code Geass",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Lelouch of the Rebellion", firstEpisode: 1, episodes: 25 },
        { name: "R2", firstEpisode: 1, episodes: 25 }
      ]
    }]
  },
  {
    id: "steins-gate",
    title: "Steins;Gate",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Steins;Gate", firstEpisode: 1, episodes: 24 }] }]
  },
  {
    id: "cowboy-bebop",
    title: "Cowboy Bebop",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Cowboy Bebop", firstEpisode: 1, episodes: 26 }] }]
  },
  {
    id: "evangelion",
    title: "Neon Genesis Evangelion",
    alt: "nge eva",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Evangelion", firstEpisode: 1, episodes: 26 }] }]
  },
  {
    id: "fairy-tail",
    title: "Fairy Tail",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Fairy Tail (2009)", firstEpisode: 1, episodes: 175 },
        { name: "Fairy Tail (2014)", firstEpisode: 176, episodes: 102 },
        { name: "Saison finale (2018)", firstEpisode: 278, episodes: 51 }
      ]
    }]
  },
  {
    id: "fire-force",
    search: "Enen no Shouboutai",
    title: "Fire Force",
    alt: "enen no shouboutai",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 24 },
        { name: "Saison 2", firstEpisode: 1, episodes: 24 },
        { name: "Saison 3 partie 1", firstEpisode: 1, episodes: 12 },
        { name: "Saison 3 partie 2", firstEpisode: 13, episodes: 13 }
      ]
    }]
  },
  {
    id: "black-clover",
    title: "Black Clover",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Black Clover", firstEpisode: 1, episodes: 170 }] }]
  },
  {
    id: "sao",
    title: "Sword Art Online",
    alt: "sao",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1 (Aincrad / ALO)", firstEpisode: 1, episodes: 25 },
        { name: "Saison 2 (GGO)", firstEpisode: 1, episodes: 24 },
        { name: "Alicization", firstEpisode: 1, episodes: 24 },
        { name: "War of Underworld", firstEpisode: 1, episodes: 23 }
      ]
    }]
  },
  {
    id: "tokyo-ghoul",
    title: "Tokyo Ghoul",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Tokyo Ghoul", firstEpisode: 1, episodes: 12 },
        { name: "√A", firstEpisode: 1, episodes: 12 },
        { name: ":re", firstEpisode: 1, episodes: 12 },
        { name: ":re 2e saison", firstEpisode: 13, episodes: 12 }
      ]
    }]
  },
  {
    id: "opm",
    search: "One Punch Man",
    title: "One Punch Man",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 12 },
        { name: "Saison 2", firstEpisode: 1, episodes: 12 }
      ]
    }]
  },
  {
    id: "mob-psycho",
    title: "Mob Psycho 100",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 12 },
        { name: "Saison 2", firstEpisode: 1, episodes: 13 },
        { name: "Saison 3", firstEpisode: 1, episodes: 12 }
      ]
    }]
  },
  {
    id: "spy-family",
    title: "Spy x Family",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 25 },
        { name: "Saison 2", firstEpisode: 1, episodes: 12 }
      ]
    }]
  },
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Saison 1", firstEpisode: 1, episodes: 12 }] }]
  },
  {
    id: "haikyuu",
    title: "Haikyuu!!",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 25 },
        { name: "Saison 2", firstEpisode: 1, episodes: 25 },
        { name: "Saison 3", firstEpisode: 1, episodes: 10 },
        { name: "To the Top", firstEpisode: 1, episodes: 25 }
      ]
    }]
  },
  {
    id: "frieren",
    search: "Sousou no Frieren",
    title: "Frieren",
    alt: "sousou no frieren",
    versions: [{ id: "tv", label: "Série TV", ...STANDARD_TIMING, seasons: [{ name: "Saison 1", firstEpisode: 1, episodes: 28 }] }]
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    versions: [{
      id: "tv", label: "Série TV", ...STANDARD_TIMING,
      seasons: [
        { name: "Saison 1", firstEpisode: 1, episodes: 12 },
        { name: "Saison 2", firstEpisode: 13, episodes: 13 }
      ]
    }]
  }
];
