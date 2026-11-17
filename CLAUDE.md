# Anime Clock

Site qui calcule combien d'épisodes d'un anime on peut regarder dans un temps donné.
Interface et textes en français.

## Stack et contraintes

- HTML, CSS et JavaScript pur. Pas de framework, pas de build, pas de dépendance npm.
- Interdit : PHP et Rust (demande explicite de l'utilisateur).
- Le site doit marcher en ouvrant `index.html` directement (protocole `file://`) et derrière n'importe quel hébergement statique.
- Ressources externes autorisées :
  - Google Fonts : Space Grotesk (texte), JetBrains Mono (chiffres).
  - Font Awesome **6.5.2 Free, pack Classic** via cdnjs. Uniquement les styles gratuits `fa-solid` et `fa-regular`. Pas d'icônes Pro, pas d'emoji ni de caractères Unicode à la place d'une icône.
  - API AniList (`https://graphql.anilist.co`) et API Jikan (`https://api.jikan.moe/v4`).
  - Traduction des synopsis : service public Google `translate.googleapis.com/translate_a/single?client=gtx` (gratuit, sans clé, CORS ouvert, non officiel donc sans garantie). MyMemory a été testé et écarté (traductions fausses).

## Arborescence

```
anime-clock/
├── index.html            Page unique : en-tête, formulaire, onglets Calcul / Détails, modal de l'affiche
├── assets/
│   ├── logo.svg          Logo (horloge + traits de vitesse manga + éclat), sert aussi de favicon
│   └── gia.png           Pictogramme GIA fourni par l'utilisateur (200 × 247 px), affiché à 64 px dans le README
├── css/
│   ├── base.css          Couleurs et thèmes, bases, en-tête, menu paramètres, mise en page, pied de page
│   ├── form.css          Formulaire : étapes, champs, recherche, mode de temps, bouton Calculer
│   └── panels.css        Onglets, résultat, frise, fiche de l'anime, synopsis, affiche en grand
├── js/                   Chargés dans cet ordre par index.html (portée globale partagée)
│   ├── config.js         Constantes (clés de stockage, délais, limites, URL d'API) et état `state`
│   ├── dom.js            Références `dom.*` vers les éléments de la page
│   ├── utils.js          Texte, nombres, dates, localStorage protégé, aides sur le catalogue
│   ├── catalog.js        Catalogue `CATALOG` écrit à la main
│   ├── api.js            AniList, Jikan, traduction Google
│   ├── selection.js      Choix de l'anime, de la version, de la saison ; résumé sous le titre
│   ├── search.js         Suggestions, recherche en ligne, navigation clavier
│   ├── time-budget.js    Mode durée / heure de fin, raccourcis, temps disponible
│   ├── calculator.js     File d'épisodes, coût d'un épisode, validation, `planSession`, `calculate`
│   ├── result-view.js    Affichage du résultat (cartes, frise, liste, notes)
│   ├── details-view.js   Fiche AniList, synopsis français / original, modal de l'affiche
│   ├── tabs.js           Onglets exclusifs
│   ├── settings.js       Menu paramètres et thème
│   ├── persistence.js    Sauvegarde et restauration du formulaire
│   └── main.js           Point d'entrée : `onFormChange`, branchement des événements, démarrage
├── docker/
│   ├── Dockerfile        nginx 1.27 alpine, construit depuis la racine
│   └── nginx.conf        gzip, `Cache-Control: no-cache` sur CSS / JS / SVG, 404 sur adresse inconnue
├── docker-compose.yml    Port 8080 côté hôte
├── scripts/serve.js      Serveur Node de test (port 5173), hors production
├── docs/REPRISE.md       Notes de reprise pour une nouvelle session
├── .claude/              launch.json (aperçu) et skills du projet
├── CLAUDE.md             Ce fichier
├── README.md             Présentation, lancement, arbre ASCII, usage de Claude, pictogramme GIA, avertissement
├── LICENSE               MIT, © 2026 Henzo RENET
└── .gitattributes        Fins de ligne LF partout
```

- Un nouveau script JS se déclare dans `index.html` à sa place dans l'ordre de chargement.
- Un nouveau dossier servi s'ajoute aux lignes `COPY` de `docker/Dockerfile`.

## Conventions de code

- Noms explicites partout : pas de variable d'une lettre (`a`, `m`, `v`, `s`…), y compris dans les callbacks. Exceptions admises : aucune.
- Un fichier JS par rôle (voir l'arborescence), sections balisées par `/* ---------- Titre ---------- */`.
- Pas de nombre magique : constante nommée dans `js/config.js`, avec un commentaire d'une ligne.
- Fonctions courtes à une responsabilité ; les fonctions de calcul (`planSession`, `episodeCost`) ne touchent pas à la page.
- Commentaires sur le pourquoi, en français. JSDoc d'une ligne (`/** … */`) pour les fonctions dont le nom ne suffit pas.
- Tout texte venant d'une API ou de l'utilisateur passe par `escapeHtml` avant `innerHTML`.
- `localStorage` uniquement via `readStorage` / `writeStorage` / `removeStorage` (protégés).
- CSS : couleurs via les variables `--color-*`, classes en kebab-case qui disent ce qu'elles stylent (`.submit-button`, `.timeline-episode`).
- Pas de modules ES : le site doit marcher en `file://`.

## Fonctionnalités

### 1. L'anime
- **Titre** (obligatoire) : champ de recherche avec suggestions, navigable au clavier (flèches, Entrée, Échap).
  1. Catalogue local (`js/catalog.js`), filtré sur `title` + `alt`, sans accents ni casse.
  2. Recherche en ligne dès 3 caractères (anti-rebond 350 ms, délai max 8 s) : AniList d'abord, Jikan en secours si AniList échoue.
  3. Entrée « saisie manuelle » pour n'importe quel titre tapé.
- **Saison / arc** (obligatoire). Les séries longues (One Piece, DBZ) sont découpées en arcs à numérotation absolue.
- **Épisode de départ** (facultatif, sans astérisque) : point de départ dans la saison. Vide = premier épisode de la saison.
- **Avancé** (replié, ouvert d'office si l'anime a plusieurs versions, est en saisie manuelle ou en cours sans compteur) :
  - Version (normale / Kai, HxH 1999 / 2011, FMA 2003 / Brotherhood…), masquée s'il n'y a qu'une version.
  - Sauter les fillers (visible seulement si la version a une liste de fillers).
  - Ne pas dépasser la fin de la saison.
  - Déjà regardé de l'épisode de départ (min + s, vides = 0) : le calcul ne compte que le reste de cet épisode. Doit rester sous sa durée. Vidé à chaque changement d'anime, de version ou de saison. Le résultat affiche « Reprise à mm:ss de l'épisode N ».
  - Durée d'un épisode (min), nombre d'épisodes (seulement pour les animes hors catalogue).

### 2. Le temps
- Deux modes : « Une durée » (heures + minutes) ou « Une heure de fin ».
- En mode heure de fin : si l'heure est passée, elle vaut pour le lendemain. Le temps restant s'affiche et se met à jour toutes les 30 s.
- Raccourcis : 30 min, 1 h, 2 h, 3 h et « Jusqu'à minuit ». Ce dernier passe en mode heure de fin à 00:00, donc jusqu'à la fin de la journée en cours.

### 3. Génériques
- Cases « Je saute les intros » et « Je saute les outros ».
- Avancé : nombre d'intros / outros regardées quand même (comptées sur les premiers épisodes de la session), durées en secondes.

### 4. Vitesse et pauses (replié)
- Vitesse ×1 à ×2, pause entre deux épisodes en minutes.

### Champs obligatoires
- Marqués d'un `*` rouge (`.required`). Pas de mention « optionnel » sur les autres. Légende « * champ obligatoire » au-dessus du bouton.
- Validation faite en JS (`validateForm()` dans `js/calculator.js`), le formulaire est en `novalidate`.

### Résultat
- Nombre d'épisodes complets, plage d'épisodes, saison(s).
- Cartes : heure de fin si on lance maintenant, marge, temps manquant pour un épisode de plus, temps gagné sur les génériques.
- Frise proportionnelle (intro / épisode / outro / marge) et liste des épisodes avec heure de début. Au-delà de 30 épisodes : 15 premiers, ellipse, 5 derniers.
- Notes : pourcentage du prochain épisode visible avec la marge, temps pour finir la saison et la série en « sessions comme celle-ci », fin de série atteinte.
- Après un premier calcul, le résultat se recalcule à chaque modification.

### Colonne de droite : onglets
- Deux onglets exclusifs : **Calcul** (ouvert par défaut) et **Détails de l'anime**. Ouvrir l'un ferme l'autre.
- Motif ARIA des onglets : `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, flèches gauche / droite au clavier.
- Bureau (≥ 900 px) : la colonne est `position: sticky` (top 20 px, hauteur max = écran − 40 px) et le contenu de l'onglet défile à l'intérieur. Mobile : colonne sous le formulaire, sans sticky.
- Un calcul réussi ramène sur l'onglet Calcul (et fait défiler jusqu'à lui en mobile).
- Avant un anime choisi ou un calcul, chaque onglet affiche un message d'attente (`.empty-state`).

### Détails de l'anime
- Infos locales immédiates : nombre d'épisodes, durée totale avec et sans génériques, fillers, versions, tableau des saisons.
- À l'ouverture de l'onglet : requête AniList (par id pour un résultat AniList, sinon par `version.search || anime.search || anime.title`). Affiche, titres natif / romaji, genres, statut, première diffusion, studio, note, synopsis. Cache par `anime.id:version.id`.
- **Affiche** : clic → `<dialog>` modal avec l'image en grand (`coverImage.extraLarge`). Fermeture par la croix, Échap, ou un clic sur l'image ou le fond.
- **Synopsis** : bascule « Français / Original ». Français par défaut, traduit automatiquement (découpe en morceaux de 1500 caractères max). Pendant la traduction ou en cas d'échec, le texte original s'affiche avec une note. Traductions gardées en mémoire et dans `localStorage`.

### Paramètres
- Bouton engrenage en haut à droite, ouvre un petit menu déroulant. Fermeture par un clic ailleurs ou Échap.
- Pour l'instant : **thème** Auto (suit le système) / Clair / Sombre, via `data-theme` sur `<html>`. Un script dans `<head>` applique le thème enregistré avant l'affichage (pas de flash).

### Mémoire locale
Toujours dans un `try/catch`, le site marche sans.
- `anime-clock:form:v2` : l'anime (id du catalogue ou objet complet pour un anime en ligne), la version, la saison, l'épisode et tous les réglages du formulaire. L'ancienne clé `anime-clock:v1` (avant le renommage des champs) est supprimée au démarrage.
- `anime-clock:theme` : `auto`, `light` ou `dark`.
- `anime-clock:synopsis-lang` : `fr` ou `original`.
- `anime-clock:fr:<id AniList>` : synopsis traduit.

## Modèle de données (`js/catalog.js`)

```js
{
  id: "dragon-ball-z",          // unique
  title: "Dragon Ball Z",       // affiché
  alt: "dbz kai",               // mots-clés de recherche locale (facultatif)
  search: "…",                  // titre à chercher sur AniList si différent (facultatif)
  versions: [{
    id: "kai", label: "Dragon Ball Z Kai",
    search: "Dragon Ball Kai",  // facultatif, prioritaire sur anime.search
    duration: 1420, opening: 90, ending: 90, // secondes : épisode complet, intro, outro
    fillers: "54-61,98-99",     // numéros absolus, plages séparées par des virgules (facultatif)
    seasons: [{ name: "…", firstEpisode: 1, episodes: 98, duration?, opening?, ending? }]
  }]
}
```

- `firstEpisode` = numéro affiché du premier épisode. Numérotation absolue pour les séries longues, ce qui permet d'appliquer les fillers.
- `STANDARD_TIMING` = `{ duration: 1420, opening: 90, ending: 90 }` (23 min 40, génériques de 90 s).
- `seasonTiming(version, season)` donne les durées d'une saison avec repli sur la version.
- Animes en ligne : convertis au même format par `animeFromSearchResult()` avec `isOnline: true`, et `hasUnknownEpisodeCount: true` si le nombre total d'épisodes est inconnu. Saisie manuelle : `manualAnime()`, avec `isManual: true`.

## Règles de calcul

- Coût d'un épisode n°i de la session (i commence à 0) :
  `(duration − intro sautée − outro sautée) / vitesse` (`episodeCost` dans `js/calculator.js`), plus la pause avant chaque épisode sauf le premier.
  L'intro est regardée si la case est décochée ou si `i < intros gardées`. Pareil pour l'outro.
- On enchaîne les épisodes tant que le total tient dans le temps disponible. On passe à la saison suivante sauf si « ne pas dépasser la saison » est coché. Les fillers sont retirés de la file si la case est cochée.
- Une durée modifiée à la main dans Avancé remplace celle de toutes les saisons (`dataset.touched`). Changer de saison remet les valeurs par défaut.
- Reprise en cours d'épisode : `upcomingEpisodes` met `alreadySeen` (secondes) sur l'épisode de départ, 0 sur les autres. `episodeCost` retire ce temps dans l'ordre intro, contenu, outro (`remainingSegments`). Le temps déjà vu ne compte pas comme temps gagné ; seuls les génériques restants et sautés comptent. L'index dans la session ne change pas, donc les « intros gardées » partent toujours de cet épisode. Un épisode de départ filler repris (décalage > 0) reste dans la file même si les fillers sont sautés.

## Style d'écriture (textes du site et docs)

Appliquer les règles **stop-slop** (https://github.com/hardikpandya/stop-slop), sans installer le skill :
- Pas de tiret cadratin, pas d'adverbes de remplissage (vraiment, simplement, juste…), pas de formules d'accroche ni de méta-commentaire.
- Voix active, phrases directes, tutoiement de l'utilisateur.
- Concret plutôt que vague, pas de « pas X, mais Y ».

## Design

- Couleur d'accent orange (`--color-accent`), intro en jaune (`--color-opening`), outro en violet (`--color-ending`).
- Mobile : marge latérale de 16 px, aucun défilement horizontal, champs d'au moins 44 px de haut.
- `[hidden]` force `display: none` (sinon les `.checkbox` / `.field` en flex restent visibles).

## README

Le README doit toujours contenir :
- l'arborescence en arbre ASCII, à jour ;
- la mention de l'usage de Claude (Anthropic) avec le pictogramme `assets/gia.png` (affiché en petit : 64 px en haut, 56 px dans la section Claude) ;
- l'avertissement : l'IA est utilisée à titre de test et d'expérimentation, sur ce projet seulement ;
- la marche à suivre pour reprendre le projet avec Claude : lire `docs/REPRISE.md` puis `CLAUDE.md` ;
- la licence MIT.

## Git et skills du projet

- Dépôt distant : `origin` = https://github.com/ProgrameurGentil/Anime-Clock.git.
- **Branches** : tout le travail passe par une branche dédiée (`feature/…`, `fix/…`, `docs/…`), créée depuis `main` au début de chaque tâche. Jamais de commit direct sur `main`.
- **`main`** ne reçoit qu'une tâche entièrement terminée et testée, et seulement avec **l'accord explicite de l'utilisateur** pour chaque fusion. Sans cet accord, la branche reste à part (poussée sur `origin` si besoin).
- Committer au fur et à mesure sur la branche : une fonctionnalité testée = un commit, message en français.
- Avant chaque commit (au minimum les commits majeurs) : skill **`maj-docs`** (`.claude/skills/maj-docs/`), qui met à jour `CLAUDE.md` et `docs/REPRISE.md`.
- Après une fonctionnalité ajoutée ou modifiée, avant de committer : skill **`relecture-code`** (`.claude/skills/relecture-code/`), relecture qualité et clarté du code.
- `.claude/` est ignoré sauf `.claude/launch.json` et `.claude/skills/`.
