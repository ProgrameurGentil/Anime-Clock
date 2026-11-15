# Anime Clock

<img src="assets/logo.svg" alt="" width="72" align="right">

Tu as deux heures devant toi, ou jusqu'à minuit ? Anime Clock te dit combien d'épisodes tu peux enchaîner, à quel épisode tu t'arrêtes et à quelle heure tu auras fini.

<img src="assets/gia.svg" alt="GIA : généré par IA avec Claude" width="176">

> **Projet de test et d'expérimentation.**
> L'intelligence artificielle est utilisée ici uniquement pour tester et expérimenter le développement assisté par IA, sur ce projet seulement. Le code, les textes et la doc ont été écrits avec Claude (Anthropic), à partir des demandes de l'auteur.

## Fonctionnalités

- **Choix de l'anime** : 30 animes connus dans le catalogue (One Piece, Naruto, Dragon Ball Z, Frieren, Fire Force…), plus une recherche en ligne sur AniList pour tous les autres, ou une saisie manuelle.
- **Saison, arc et version** : normale ou Kai, HxH 1999 ou 2011, FMA 2003 ou Brotherhood. Épisode de départ au choix.
- **Ton temps** : une durée (30 min, 1 h, 2 h…) ou une heure de fin, avec un raccourci « Jusqu'à minuit ».
- **Génériques** : saute les intros et les outros, ou garde-en quelques-unes. Durées réglables.
- **Bonus** : fillers sautés (One Piece, Naruto, Shippuden, Bleach), vitesse de lecture ×1 à ×2, pause entre les épisodes.
- **Résultat** : nombre d'épisodes, heure de fin, marge, frise des épisodes, temps restant pour finir la saison ou la série.
- **Fiche de l'anime** : affiche (agrandissable), genres, studio, note, synopsis en français ou en version originale.
- **Thème** clair, sombre ou automatique. Tes réglages sont gardés dans le navigateur.

## Lancer le site

### Sans rien installer

Ouvre `index.html` dans ton navigateur.

### Avec Node (serveur local)

```bash
node scripts/serve.js
```

Puis va sur http://localhost:5173.

### Avec Docker

```bash
docker compose up -d --build
```

Puis va sur http://localhost:8080. Pour arrêter :

```bash
docker compose down
```

Sans Compose, depuis la racine du projet :

```bash
docker build -f docker/Dockerfile -t anime-clock .
```

```bash
docker run -d -p 8080:80 --name anime-clock anime-clock
```

L'image sert seulement `index.html`, `assets/`, `css/` et `js/` avec nginx (`nginx:1.27-alpine`).

## Arborescence

```
anime-clock/
├── index.html                 Page unique du site
├── assets/
│   ├── logo.svg               Logo et favicon
│   └── gia.svg                Pictogramme GIA (généré par IA)
├── css/
│   ├── base.css               Couleurs, thèmes, en-tête, mise en page
│   ├── form.css               Formulaire
│   └── panels.css             Onglets, résultat, fiche, affiche en grand
├── js/                        Chargés dans cet ordre par index.html
│   ├── config.js              Constantes et état de la page
│   ├── dom.js                 Références vers les éléments de la page
│   ├── utils.js               Texte, nombres, dates, stockage
│   ├── catalog.js             Catalogue des animes
│   ├── api.js                 AniList, Jikan, traduction
│   ├── selection.js           Choix de l'anime, de la version, de la saison
│   ├── search.js              Recherche et suggestions
│   ├── time-budget.js         Durée ou heure de fin
│   ├── calculator.js          Calcul de la session
│   ├── result-view.js         Affichage du résultat
│   ├── details-view.js        Fiche de l'anime et synopsis
│   ├── tabs.js                Onglets Calcul / Détails
│   ├── settings.js            Menu paramètres et thème
│   ├── persistence.js         Sauvegarde du formulaire
│   └── main.js                Démarrage de la page
├── docker/
│   ├── Dockerfile             Image nginx
│   └── nginx.conf             Configuration du serveur
├── docker-compose.yml         Lancement Docker (port 8080)
├── scripts/
│   └── serve.js               Serveur Node de test (port 5173)
├── docs/
│   └── REPRISE.md             Notes pour reprendre le projet
├── .claude/
│   ├── launch.json            Aperçu dans l'app Claude
│   └── skills/                Skills du projet (maj-docs, relecture-code)
├── CLAUDE.md                  Spécifications et conventions de code
├── README.md                  Ce fichier
└── LICENSE                    Licence MIT
```

## Ajouter un anime au catalogue

Ajoute une entrée dans `CATALOG` (`js/catalog.js`) :

```js
{
  id: "mon-anime",
  title: "Mon Anime",
  versions: [{
    id: "tv", label: "Série TV", ...STANDARD_TIMING,
    seasons: [
      { name: "Saison 1", firstEpisode: 1, episodes: 12 },
      { name: "Saison 2", firstEpisode: 13, episodes: 12 }
    ]
  }]
}
```

Le format complet (versions, fillers, durées par saison) est décrit dans `CLAUDE.md`.

## Développé avec Claude

<img src="assets/gia.svg" alt="GIA" width="132" align="right">

Ce projet a été construit avec **Claude** (Anthropic), via Claude Code, dans le cadre d'un test du développement assisté par IA :

- Claude a écrit le code, le catalogue, les textes du site et la documentation, à partir des demandes de l'auteur.
- Chaque étape a été testée dans le navigateur puis committée avec la mention `Co-Authored-By: Claude`.
- Les textes suivent les règles [stop-slop](https://github.com/hardikpandya/stop-slop) pour éviter les tournures typiques des IA.
- Deux skills du projet (`.claude/skills/`) encadrent le travail : `maj-docs` met à jour la doc avant chaque commit, `relecture-code` relit le code pour le garder clair.

### Reprendre le projet avec Claude

Avant toute nouvelle demande dans une nouvelle session, demande à Claude de lire, dans cet ordre :

1. `docs/REPRISE.md` : où en est le projet, comment le lancer et le tester, points d'attention, tes préférences.
2. `CLAUDE.md` : spécifications complètes, arborescence et conventions de code.

Par exemple : « Lis d'abord docs/REPRISE.md puis CLAUDE.md, ensuite on continue. »

## Sources des données

- Catalogue écrit à la main. Durées moyennes (23 min 40 par épisode, 90 s par générique).
- Listes de fillers : listes tenues par les fans, à prendre comme repère.
- Recherche et fiches : [AniList](https://anilist.co), avec [Jikan](https://jikan.moe) (MyAnimeList) en secours.
- Traduction des synopsis : service public de Google Translate, gratuit et sans clé, sans garantie de disponibilité.
- Icônes : [Font Awesome Free](https://fontawesome.com) 6.5.2.

## Technique

HTML, CSS et JavaScript, sans framework ni étape de build.

## Licence

[MIT](LICENSE) © 2026 Henzo RENET
