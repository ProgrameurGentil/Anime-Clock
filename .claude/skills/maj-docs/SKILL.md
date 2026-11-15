---
name: maj-docs
description: Met à jour CLAUDE.md et REPRISE.md pour qu'ils reflètent le code avant un commit d'Anime Clock. À utiliser avant chaque commit du projet, et obligatoirement avant un commit majeur (nouvelle fonctionnalité, changement de structure, de dépendance ou de comportement visible).
---

# Mise à jour des docs avant commit

Anime Clock a deux fichiers de doc qui doivent toujours décrire le code tel qu'il est committé :

- `CLAUDE.md` : spécifications du projet (stack, contraintes, fonctionnalités, modèle de données, règles de calcul, style, design, git).
- `REPRISE.md` : état du projet pour une nouvelle session (ce qui est fait, comment lancer et tester, points d'attention, idées, préférences de l'utilisateur).

## Quand

- Avant **chaque** commit qui touche au comportement, à la structure, aux dépendances ou à la façon de lancer le projet.
- Un commit purement cosmétique (faute de frappe, espace, renommage local sans effet) peut s'en passer. En cas de doute, mets à jour.

## Étapes

1. Regarde ce qui part dans le commit : `git status --short` puis `git diff` (et `git diff --cached` si des fichiers sont déjà indexés).
2. Pour chaque changement, demande-toi :
   - Une fonctionnalité apparaît, change ou disparaît ? → section « Fonctionnalités » de `CLAUDE.md`.
   - Un fichier, un dossier, une dépendance externe ou une API ? → « Fichiers » et « Stack et contraintes ».
   - Le format de `data.js` ou une règle de calcul ? → « Modèle de données » / « Règles de calcul ».
   - La façon de lancer, tester ou déployer ? → « Lancer et tester » de `REPRISE.md` (et le README s'il existe).
   - Une limite connue, un bug contourné, une API capricieuse ? → « Points d'attention » de `REPRISE.md`.
   - Une demande de l'utilisateur sur sa façon de travailler ? → « Préférences de l'utilisateur » de `REPRISE.md`.
3. Dans `REPRISE.md`, mets à jour « État au JJ/MM/AAAA » avec la date du jour et ajoute la ligne de la nouvelle étape. Retire des « Idées pour la suite » ce qui vient d'être fait.
4. Supprime ce qui n'est plus vrai. Une doc qui décrit un ancien comportement est pire qu'une doc absente.
5. Relis les deux fichiers en entier une fois : pas de contradiction entre eux, ni avec le code.
6. Ajoute les fichiers de doc au même commit que le code (`git add CLAUDE.md REPRISE.md`). Pas de commit séparé « maj doc », sauf si la doc seule a changé.

## Style

- Français, règles stop-slop : phrases directes, voix active, pas de tiret cadratin, pas d'adverbes de remplissage, pas de méta-commentaire.
- Concret : noms de fichiers, de fonctions, valeurs. Pas de « amélioration diverses ».
- Court : une ligne par fait quand c'est possible.
