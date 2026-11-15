# Reprise du projet

Notes pour une nouvelle session qui reprend Anime Clock. Les spécifications complètes sont dans `CLAUDE.md`.

## État au 15/11/2026

Tout ce qui a été demandé est fait, testé dans le navigateur (bureau 1280 px et mobile 375 px) et committé sur `main` :

1. Premier jet : calcul, catalogue, recherche en ligne.
2. Raccourci « Jusqu'à minuit » (fin de la journée en cours).
3. Astérisques sur les champs obligatoires, mention « optionnel » retirée.
4. Icônes Font Awesome 6.5.2 Free (Classic) et logo `logo.svg`.
5. Panneau « Détails de l'anime » replié par défaut, au-dessus du résultat.
6. Cette doc (`CLAUDE.md` et `REPRISE.md`).
7. Skills du projet `maj-docs` et `relecture-code` (`.claude/skills/`).
8. Colonne de droite en onglets Calcul / Détails (sticky), synopsis traduit en français avec bascule vers l'original, affiche en grand dans un modal, menu paramètres avec choix du thème.
9. Docker (nginx) et `README.md`. Image testée : une adresse inconnue répond 404 au lieu de renvoyer la page d'accueil.
10. Relecture qualité de `app.js` (skill `relecture-code`) : noms clarifiés, constantes nommées en tête de fichier, un seul point d'appel AniList (`aniListQuery`), titres en double retirés de la fiche. Comportement inchangé, cas de référence vérifié.

`git log --oneline` donne l'historique détaillé.

## Lancer et tester

- Le plus simple : ouvrir `index.html` dans un navigateur.
- Serveur local : `node scripts/serve.js` puis http://localhost:5173. Dans l'app Claude, `.claude/launch.json` déclare la config `anime-clock` pour l'aperçu.
- Docker : `docker compose up -d --build` puis http://localhost:8080, `docker compose down` pour arrêter. Testé : conteneur « healthy », 5 fichiers servis avec le bon type et en gzip, adresse inconnue en 404, cas de référence identique.
- Pas de tests automatisés. On vérifie dans le navigateur, et les fonctions sont globales, donc testables depuis la console :
  - `pickAnime(CATALOG.find(a => a.id === "one-piece"))` sélectionne un anime.
  - `els.form.requestSubmit()` lance le calcul, puis `els.result.innerText` donne le résultat.
  - `fetchAniListDetails(anime)` vérifie quelle fiche AniList correspond.
- Cas de référence vérifié à la main : One Piece, arc Water Seven, départ au 250, fillers sautés, 3 h, intros sautées sauf la première, outros sautées → **8 épisodes (250 à 257), 17 min de marge**.

## Points d'attention

- **Jikan (MyAnimeList) ne répondait plus** depuis la machine de l'utilisateur pendant le développement (timeout de connexion). C'est pour ça qu'AniList est passé en source principale. Jikan reste en secours mais n'a jamais pu être testé avec une vraie réponse.
- **Catalogue figé à fin 2025** : One Piece s'arrête à l'épisode 1122. JJK saison 3, MHA saison finale, Spy x Family saison 3, One Punch Man saison 3 et Frieren saison 2 manquent. Fire Force a ses 4 parties (jusqu'à la saison 3 partie 2, 2026).
- **Listes de fillers** (One Piece, Naruto, Shippuden, Bleach) : reprises des listes de fans, à prendre comme repère.
- **DBZ Kai** : 98 + 69 épisodes (numérotation internationale). AniList compte 97 pour Kai.
- **Synopsis** : AniList ne fournit que l'anglais. La traduction passe par le service public Google (`client=gtx`), gratuit mais non officiel : il peut couper ou limiter sans prévenir. Le site retombe alors sur le texte original.
- Sur AniList, chaque saison est une fiche séparée. Pour enchaîner plusieurs saisons d'un anime hors catalogue, il faut l'ajouter dans `data.js`.
- Le serveur de test servait `.svg` en binaire au début, ce qui cassait le logo. C'est corrigé dans `scripts/serve.js`. Si une ressource ne s'affiche pas, vérifier les types MIME de ce script.
- La fin de ligne : Git convertit LF en CRLF sur cette machine Windows (avertissements sans gravité).

## Idées pour la suite (non demandées)

- Compléter le catalogue avec les saisons 2025-2026 et les animes manquants (Gintama, Dandadan, Vinland Saga…).
- Regrouper automatiquement les saisons d'un même anime trouvé sur AniList (relations `PREQUEL` / `SEQUEL`).
- Fillers pour Fairy Tail et DBZ.
- Bouton pour copier ou partager le résultat.
- Autres réglages dans le menu paramètres (langue par défaut du synopsis, durée de générique par défaut…).
- Hébergement gratuit (GitHub Pages ou Netlify) : aucun build, il suffit de publier le dossier.

## Préférences de l'utilisateur

- Réponses et site en français.
- Poser des questions avant de démarrer quand un choix lui revient, sauf pour les bonus.
- Committer au fur et à mesure des ajouts testés.
- Pas de PHP ni de Rust. Icônes Font Awesome gratuites uniquement.
- Écriture selon les règles stop-slop.
