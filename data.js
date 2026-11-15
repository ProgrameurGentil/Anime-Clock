// Catalogue écrit à la main.
// Durées en secondes. dur = durée totale d'un épisode, op = générique d'ouverture, ed = générique de fin.
// Une saison peut surcharger dur / op / ed.
// "first" = numéro du premier épisode de la saison (numérotation absolue pour les séries longues).
// "fillers" = épisodes hors manga, numérotation absolue (sources : listes de fans, à prendre comme repère).

const STD = { dur: 1420, op: 90, ed: 90 };

const CATALOG = [
  {
    id: "one-piece",
    title: "One Piece",
    versions: [{
      id: "tv", label: "Série TV", ...STD, op: 120,
      fillers: "54-61,98-99,102,131-143,196-206,220-226,279-283,291-292,303,317-319,326-336,382-384,406-407,426-429,457-458,492,542,575-578,590,626-627,747-750,780-782,895-896,907,1029-1030",
      seasons: [
        { name: "East Blue", first: 1, eps: 61 },
        { name: "Alabasta", first: 62, eps: 74 },
        { name: "Skypiea", first: 136, eps: 71 },
        { name: "Water Seven", first: 207, eps: 119 },
        { name: "Thriller Bark", first: 326, eps: 59 },
        { name: "Guerre au sommet", first: 385, eps: 132 },
        { name: "Île des Hommes-Poissons", first: 517, eps: 58 },
        { name: "Dressrosa", first: 575, eps: 172 },
        { name: "Whole Cake Island", first: 747, eps: 145 },
        { name: "Wano", first: 892, eps: 194 },
        { name: "Egghead (jusqu'au 1122)", first: 1086, eps: 37 }
      ]
    }]
  },
  {
    id: "naruto",
    title: "Naruto",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      fillers: "26,97,101-106,136-220",
      seasons: [{ name: "Naruto", first: 1, eps: 220 }]
    }]
  },
  {
    id: "naruto-shippuden",
    title: "Naruto Shippuden",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      fillers: "57-71,90-112,127-133,144-151,170-171,176-196,223-242,257-260,271,279-281,284-295,303-320,347-361,376-377,388-390,394-413,416,422-423,427-450,452-458,460-462,464-469,480-483",
      seasons: [{ name: "Shippuden", first: 1, eps: 500 }]
    }]
  },
  {
    id: "dragon-ball",
    title: "Dragon Ball",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Dragon Ball", first: 1, eps: 153 }] }]
  },
  {
    id: "dragon-ball-z",
    title: "Dragon Ball Z",
    alt: "dbz kai",
    versions: [
      {
        id: "tv", label: "Dragon Ball Z (originale)", ...STD,
        seasons: [
          { name: "Saiyans", first: 1, eps: 35 },
          { name: "Namek / Freezer", first: 36, eps: 72 },
          { name: "Garlic Jr.", first: 108, eps: 10 },
          { name: "Cyborgs / Cell", first: 118, eps: 77 },
          { name: "Boo", first: 195, eps: 97 }
        ]
      },
      {
        id: "kai", label: "Dragon Ball Z Kai", ...STD,
        seasons: [
          { name: "Kai (Saiyans à Cell)", first: 1, eps: 98 },
          { name: "The Final Chapters (Boo)", first: 99, eps: 69 }
        ]
      }
    ]
  },
  {
    id: "dragon-ball-super",
    title: "Dragon Ball Super",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Super", first: 1, eps: 131 }] }]
  },
  {
    id: "bleach",
    title: "Bleach",
    alt: "tybw thousand year blood war",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      fillers: "33,50,64-108,128-137,147-149,168-189,204-205,213-214,227-266,287,298-299,303-305,311-341,355",
      seasons: [
        { name: "Série originale", first: 1, eps: 366 },
        { name: "TYBW partie 1", first: 367, eps: 13 },
        { name: "TYBW partie 2", first: 380, eps: 13 },
        { name: "TYBW partie 3", first: 393, eps: 14 }
      ]
    }]
  },
  {
    id: "hxh",
    title: "Hunter x Hunter",
    versions: [
      { id: "2011", label: "Version 2011", ...STD, seasons: [{ name: "Hunter x Hunter (2011)", first: 1, eps: 148 }] },
      { id: "1999", label: "Version 1999", ...STD, seasons: [{ name: "Hunter x Hunter (1999)", first: 1, eps: 62 }] }
    ]
  },
  {
    id: "fma",
    title: "Fullmetal Alchemist",
    alt: "brotherhood",
    versions: [
      { id: "fmab", label: "Brotherhood (2009)", ...STD, seasons: [{ name: "Brotherhood", first: 1, eps: 64 }] },
      { id: "fma", label: "Version 2003", ...STD, seasons: [{ name: "FMA (2003)", first: 1, eps: 51 }] }
    ]
  },
  {
    id: "aot",
    title: "L'Attaque des Titans",
    alt: "attack on titan shingeki no kyojin snk",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 25 },
        { name: "Saison 2", first: 1, eps: 12 },
        { name: "Saison 3 partie 1", first: 1, eps: 12 },
        { name: "Saison 3 partie 2", first: 13, eps: 10 },
        { name: "Saison finale partie 1", first: 1, eps: 16 },
        { name: "Saison finale partie 2", first: 17, eps: 12 },
        { name: "Chapitres finaux (2 spéciaux)", first: 1, eps: 2, dur: 4400, op: 90, ed: 150 }
      ]
    }]
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    alt: "kimetsu no yaiba",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 26 },
        { name: "Le Train de l'Infini (TV)", first: 1, eps: 7 },
        { name: "Quartier des plaisirs", first: 1, eps: 11 },
        { name: "Village des forgerons", first: 1, eps: 11 },
        { name: "Entraînement des piliers", first: 1, eps: 8 }
      ]
    }]
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 24 },
        { name: "Saison 2", first: 25, eps: 23 }
      ]
    }]
  },
  {
    id: "mha",
    title: "My Hero Academia",
    alt: "boku no hero academia",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 13 },
        { name: "Saison 2", first: 14, eps: 25 },
        { name: "Saison 3", first: 39, eps: 25 },
        { name: "Saison 4", first: 64, eps: 25 },
        { name: "Saison 5", first: 89, eps: 25 },
        { name: "Saison 6", first: 114, eps: 25 },
        { name: "Saison 7", first: 139, eps: 21 }
      ]
    }]
  },
  {
    id: "death-note",
    title: "Death Note",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Death Note", first: 1, eps: 37 }] }]
  },
  {
    id: "code-geass",
    title: "Code Geass",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Lelouch of the Rebellion", first: 1, eps: 25 },
        { name: "R2", first: 1, eps: 25 }
      ]
    }]
  },
  {
    id: "steins-gate",
    title: "Steins;Gate",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Steins;Gate", first: 1, eps: 24 }] }]
  },
  {
    id: "cowboy-bebop",
    title: "Cowboy Bebop",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Cowboy Bebop", first: 1, eps: 26 }] }]
  },
  {
    id: "evangelion",
    title: "Neon Genesis Evangelion",
    alt: "nge eva",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Evangelion", first: 1, eps: 26 }] }]
  },
  {
    id: "fairy-tail",
    title: "Fairy Tail",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Fairy Tail (2009)", first: 1, eps: 175 },
        { name: "Fairy Tail (2014)", first: 176, eps: 102 },
        { name: "Saison finale (2018)", first: 278, eps: 51 }
      ]
    }]
  },
  {
    id: "fire-force",
    title: "Fire Force",
    alt: "enen no shouboutai",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 24 },
        { name: "Saison 2", first: 1, eps: 24 },
        { name: "Saison 3 partie 1", first: 1, eps: 12 },
        { name: "Saison 3 partie 2", first: 13, eps: 13 }
      ]
    }]
  },
  {
    id: "black-clover",
    title: "Black Clover",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Black Clover", first: 1, eps: 170 }] }]
  },
  {
    id: "sao",
    title: "Sword Art Online",
    alt: "sao",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1 (Aincrad / ALO)", first: 1, eps: 25 },
        { name: "Saison 2 (GGO)", first: 1, eps: 24 },
        { name: "Alicization", first: 1, eps: 24 },
        { name: "War of Underworld", first: 1, eps: 23 }
      ]
    }]
  },
  {
    id: "tokyo-ghoul",
    title: "Tokyo Ghoul",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Tokyo Ghoul", first: 1, eps: 12 },
        { name: "√A", first: 1, eps: 12 },
        { name: ":re", first: 1, eps: 12 },
        { name: ":re 2e saison", first: 13, eps: 12 }
      ]
    }]
  },
  {
    id: "opm",
    title: "One Punch Man",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 12 },
        { name: "Saison 2", first: 1, eps: 12 }
      ]
    }]
  },
  {
    id: "mob-psycho",
    title: "Mob Psycho 100",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 12 },
        { name: "Saison 2", first: 1, eps: 13 },
        { name: "Saison 3", first: 1, eps: 12 }
      ]
    }]
  },
  {
    id: "spy-family",
    title: "Spy x Family",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 25 },
        { name: "Saison 2", first: 1, eps: 12 }
      ]
    }]
  },
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Saison 1", first: 1, eps: 12 }] }]
  },
  {
    id: "haikyuu",
    title: "Haikyuu!!",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 25 },
        { name: "Saison 2", first: 1, eps: 25 },
        { name: "Saison 3", first: 1, eps: 10 },
        { name: "To the Top", first: 1, eps: 25 }
      ]
    }]
  },
  {
    id: "frieren",
    title: "Frieren",
    alt: "sousou no frieren",
    versions: [{ id: "tv", label: "Série TV", ...STD, seasons: [{ name: "Saison 1", first: 1, eps: 28 }] }]
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    versions: [{
      id: "tv", label: "Série TV", ...STD,
      seasons: [
        { name: "Saison 1", first: 1, eps: 12 },
        { name: "Saison 2", first: 13, eps: 13 }
      ]
    }]
  }
];
