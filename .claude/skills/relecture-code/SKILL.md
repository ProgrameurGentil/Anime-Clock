---
name: relecture-code
description: Relit le code écrit pour Anime Clock, l'optimise et le clarifie pour qu'un humain le comprenne à la première lecture. À utiliser après avoir ajouté ou modifié une fonctionnalité, avant de la committer, ou quand l'utilisateur demande une relecture ou un nettoyage du code.
---

# Relecture qualité du code

Objectif : un développeur qui ouvre un fichier de `js/`, `css/` ou `index.html` pour la première fois comprend ce que fait chaque bloc sans avoir à exécuter le code. Le comportement visible ne change pas.

## Périmètre

- Par défaut : le code modifié depuis le dernier commit (`git diff`, plus les fichiers nouveaux de `git status`).
- Si l'utilisateur le demande, ou si le diff touche un bloc mal écrit : tout le fichier concerné.

## Grille de relecture

Pour chaque fichier, passe dans cet ordre et note ce qui accroche.

1. **Exactitude** (avant tout le reste)
   - Cas limites : saison vide, épisode hors plage, temps nul, anime sans durée, API qui répond vide ou pas du tout.
   - Asynchrone : une réponse lente ne doit pas écraser l'affichage d'un anime choisi depuis (comparer l'anime courant avant de rendre).
   - `localStorage` passe uniquement par `readStorage` / `writeStorage` / `removeStorage` (`js/utils.js`).
   - Tout texte venant d'une API ou de l'utilisateur passe par `escapeHtml` avant `innerHTML`.
2. **Lisibilité**
   - Noms qui disent ce que la chose contient (`watchedEpisodes` plutôt que `w`). Aucune variable d'une lettre, callbacks compris.
   - Une fonction = une responsabilité. Au-delà d'environ 60 lignes, chercher un découpage naturel.
   - Pas de nombre magique : une constante nommée dans `js/config.js`.
   - Chaque fonction est dans le fichier de son rôle (voir l'arborescence de `CLAUDE.md`).
   - Commentaires sur le *pourquoi*, pas sur le *quoi*. Supprimer ceux qui répètent le code.
   - Sections du fichier balisées par les bandeaux `/* ---------- Titre ---------- */`, dans un ordre logique.
3. **Simplicité**
   - Code mort, variables inutilisées, doublons : supprimer.
   - Deux blocs presque identiques : une fonction commune s'il y en a trois, ou si les deux vont évoluer ensemble.
   - Pas d'abstraction « pour plus tard ».
4. **Performance** (seulement là où ça compte)
   - Pas de requête réseau répétée pour la même donnée : cache.
   - Pas de recalcul lourd à chaque frappe sans anti-rebond.
   - Les boucles sur One Piece (plus de 1100 épisodes) restent instantanées.
5. **CSS et HTML**
   - Couleurs via les variables `--color-*` de `css/base.css`, jamais en dur (sauf `assets/logo.svg`).
   - Sélecteurs courts, pas de `!important` hors `[hidden]`.
   - Accessibilité : `label` lié à chaque champ, `aria-*` sur les composants maison (onglets, menu, modal), focus visible, navigation clavier.
   - Mobile 375 px : aucun défilement horizontal.

## Méthode

1. Lis le fichier en entier avant de toucher quoi que ce soit.
2. Liste les problèmes trouvés, classés : exactitude, puis lisibilité, puis le reste.
3. Corrige par petites modifications (Edit), une intention à la fois.
4. Vérifie dans le navigateur (aperçu `anime-clock` de `.claude/launch.json`) :
   - Le cas de référence de `docs/REPRISE.md` donne toujours le même résultat.
   - La console ne montre pas de nouvelle erreur.
   - Les parties touchées marchent au clic et au clavier, en bureau et en 375 px.
5. Résume à l'utilisateur ce qui a changé et pourquoi, en quelques lignes. Signale ce que tu as vu sans le corriger.

## Ce qu'on ne fait pas

- Pas de framework, pas de build, pas de dépendance ajoutée pour « faire propre ».
- Pas de réécriture complète quand une retouche suffit.
- Pas de changement de comportement glissé dans une relecture : s'il faut en changer un, le dire et demander.
