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

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page : formulaire à gauche, colonne droite (détails + résultat). |
| `styles.css` | Thème clair et sombre (tokens CSS sur `:root`, bascule via `prefers-color-scheme`), mise en page responsive. |
| `app.js` | Recherche, sélection, calcul, rendu du résultat, panneau détails, mémoire locale. |
| `data.js` | Catalogue `CATALOG` écrit à la main. |
| `logo.svg` | Logo (horloge + traits de vitesse manga + éclat). Sert aussi de favicon. |
| `scripts/serve.js` | Petit serveur Node pour tester en local (port 5173). Pas utilisé en production. |

## Fonctionnalités

### 1. L'anime
- **Titre** (obligatoire) : champ de recherche avec suggestions, navigable au clavier (flèches, Entrée, Échap).
  1. Catalogue local (`data.js`), filtré sur `title` + `alt`, sans accents ni casse.
  2. Recherche en ligne dès 3 caractères (anti-rebond 350 ms, délai max 8 s) : AniList d'abord, Jikan en secours si AniList échoue.
  3. Entrée « saisie manuelle » pour n'importe quel titre tapé.
- **Saison / arc** (obligatoire). Les séries longues (One Piece, DBZ) sont découpées en arcs à numérotation absolue.
- **Épisode de départ** (facultatif, sans astérisque) : point de départ dans la saison. Vide = premier épisode de la saison.
- **Avancé** (replié, ouvert d'office si l'anime a plusieurs versions, est en saisie manuelle ou en cours sans compteur) :
  - Version (normale / Kai, HxH 1999 / 2011, FMA 2003 / Brotherhood…), masquée s'il n'y a qu'une version.
  - Sauter les fillers (visible seulement si la version a une liste de fillers).
  - Ne pas dépasser la fin de la saison.
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
- Marqués d'un `*` rouge (`.req`). Pas de mention « optionnel » sur les autres. Légende « * champ obligatoire » au-dessus du bouton.
- Validation faite en JS (`validate()`), le formulaire est en `novalidate`.

### Résultat
- Nombre d'épisodes complets, plage d'épisodes, saison(s).
- Cartes : heure de fin si on lance maintenant, marge, temps manquant pour un épisode de plus, temps gagné sur les génériques.
- Frise proportionnelle (intro / épisode / outro / marge) et liste des épisodes avec heure de début. Au-delà de 30 épisodes : 15 premiers, ellipse, 5 derniers.
- Notes : pourcentage du prochain épisode visible avec la marge, temps pour finir la saison et la série en « sessions comme celle-ci », fin de série atteinte.
- Après un premier calcul, le résultat se recalcule à chaque modification.

### Détails de l'anime
- Panneau `<details>` **replié par défaut**, placé au-dessus du résultat dans la colonne de droite. Il se replie à chaque nouvel anime.
- Infos locales immédiates : nombre d'épisodes, durée totale avec et sans génériques, fillers, versions, tableau des saisons.
- À l'ouverture : requête AniList (par id pour un résultat AniList, sinon par `version.search || anime.search || anime.title`). Affiche, titres natif / romaji, genres, statut, première diffusion, studio, note, synopsis (en anglais). Cache par `anime.id:version.id`.

### Mémoire locale
- `localStorage` clé `anime-clock:v1`, toujours dans un `try/catch`. Garde l'anime (id du catalogue ou objet complet pour un anime en ligne), la version, la saison, l'épisode et tous les réglages.

## Modèle de données (`data.js`)

```js
{
  id: "dragon-ball-z",          // unique
  title: "Dragon Ball Z",       // affiché
  alt: "dbz kai",               // mots-clés de recherche locale (facultatif)
  search: "…",                  // titre à chercher sur AniList si différent (facultatif)
  versions: [{
    id: "kai", label: "Dragon Ball Z Kai",
    search: "Dragon Ball Kai",  // facultatif, prioritaire sur anime.search
    dur: 1420, op: 90, ed: 90,  // secondes : durée totale, intro, outro
    fillers: "54-61,98-99",     // numéros absolus, plages séparées par des virgules (facultatif)
    seasons: [{ name: "…", first: 1, eps: 98, dur?, op?, ed? }]
  }]
}
```

- `first` = numéro affiché du premier épisode. Numérotation absolue pour les séries longues, ce qui permet d'appliquer les fillers.
- `STD` = `{ dur: 1420, op: 90, ed: 90 }` (23 min 40, génériques de 90 s).
- Animes en ligne : convertis au même format par `fromRemote()` avec `api: true`. `unknownCount: true` si le nombre total d'épisodes est inconnu. Saisie manuelle : `manual: true`.

## Règles de calcul

- Coût d'un épisode n°i de la session (i commence à 0) :
  `(dur − intro sautée − outro sautée) / vitesse`, plus la pause avant chaque épisode sauf le premier.
  L'intro est regardée si la case est décochée ou si `i < intros gardées`. Pareil pour l'outro.
- On enchaîne les épisodes tant que le total tient dans le temps disponible. On passe à la saison suivante sauf si « ne pas dépasser la saison » est coché. Les fillers sont retirés de la file si la case est cochée.
- Une durée modifiée à la main dans Avancé remplace celle de toutes les saisons (`dataset.touched`). Changer de saison remet les valeurs par défaut.

## Style d'écriture (textes du site et docs)

Appliquer les règles **stop-slop** (https://github.com/hardikpandya/stop-slop), sans installer le skill :
- Pas de tiret cadratin, pas d'adverbes de remplissage (vraiment, simplement, juste…), pas de formules d'accroche ni de méta-commentaire.
- Voix active, phrases directes, tutoiement de l'utilisateur.
- Concret plutôt que vague, pas de « pas X, mais Y ».

## Design

- Couleur d'accent orange (`--accent`), intro en jaune (`--op`), outro en violet (`--ed`).
- Mobile : marge latérale de 16 px, aucun défilement horizontal, champs d'au moins 44 px de haut.
- `[hidden]` force `display: none` (sinon les `.check` / `.field` en flex restent visibles).

## Git

- Committer au fur et à mesure : une fonctionnalité testée = un commit, message en français.
- `.claude/` est ignoré sauf `.claude/launch.json`.
