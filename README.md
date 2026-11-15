# Anime Clock

<img src="logo.svg" alt="" width="64" align="right">

Tu as deux heures devant toi, ou jusqu'à minuit ? Anime Clock te dit combien d'épisodes tu peux enchaîner, à quel épisode tu t'arrêtes et à quelle heure tu auras fini.

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

Sans Compose :

```bash
docker build -t anime-clock .
```

```bash
docker run -d -p 8080:80 --name anime-clock anime-clock
```

L'image sert les fichiers avec nginx (`nginx:1.27-alpine`, config dans `docker/nginx.conf`).

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | La page |
| `styles.css` | Thèmes clair et sombre, mise en page responsive |
| `app.js` | Recherche, calcul, affichage, fiche, paramètres |
| `data.js` | Catalogue des animes (saisons, durées, fillers) |
| `logo.svg` | Logo et favicon |
| `scripts/serve.js` | Serveur de test Node |
| `Dockerfile`, `docker-compose.yml`, `docker/` | Image Docker |
| `CLAUDE.md` | Spécifications complètes du projet |
| `REPRISE.md` | Notes pour reprendre le projet |

## Ajouter un anime au catalogue

Ajoute une entrée dans `CATALOG` (`data.js`) :

```js
{
  id: "mon-anime",
  title: "Mon Anime",
  versions: [{
    id: "tv", label: "Série TV", ...STD,
    seasons: [
      { name: "Saison 1", first: 1, eps: 12 },
      { name: "Saison 2", first: 13, eps: 12 }
    ]
  }]
}
```

Le format complet (versions, fillers, durées par saison) est décrit dans `CLAUDE.md`.

## Sources des données

- Catalogue écrit à la main. Durées moyennes (23 min 40 par épisode, 90 s par générique).
- Listes de fillers : listes tenues par les fans, à prendre comme repère.
- Recherche et fiches : [AniList](https://anilist.co), avec [Jikan](https://jikan.moe) (MyAnimeList) en secours.
- Traduction des synopsis : service public de Google Translate, gratuit et sans clé, sans garantie de disponibilité.
- Icônes : [Font Awesome Free](https://fontawesome.com) 6.5.2.

## Technique

HTML, CSS et JavaScript, sans framework ni étape de build.
