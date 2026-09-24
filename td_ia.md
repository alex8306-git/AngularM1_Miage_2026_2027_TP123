# TD IA — TP1 Mission 1 et TP2 Mission 2

**État** : tout est appliqué dans `frontend-starter/`, `npm run build` passe sans erreur.
`backend/` n'est pas touché, `API_CONTRACT.md` est inchangé.

---

## 1. Fichiers modifiés

### TP1 — Mission 1 (11 fichiers, +211 / −33 lignes)

| Chemin (`frontend-starter/src/…`) | Ce qui change |
|---|---|
| `app/shared/interceptors/error.interceptor.ts` | **créé** — sur un `401` (hors `/api/auth/`), nettoie l'état et renvoie sur `/login` |
| `main.ts` | enregistre ce nouvel intercepteur |
| `app/shared/services/auth.service.ts` | ajoute `isLoggedIn` et `restoreSession()` (recharge le profil après un F5) |
| `app/components/app/app.ts` + `.html` | bouton **Déconnexion**, navigation selon l'état connecté, appel de `restoreSession()` |
| `app/components/login-page/*` | messages d'erreur par champ, bouton désactivé si invalide, anti double-envoi, mot de passe démo retiré du code |
| `app/components/register-page/*` | idem + règles alignées sur le backend (nom ≥ 2, mot de passe ≥ 8) |
| `app/components/profile-page/*` | charge `/api/users/me` à l'arrivée sur la page, affiche les erreurs et une confirmation |

### TP2 — Mission 2 (5 fichiers + 1 dépendance)

| Chemin | Ce qui change |
|---|---|
| `src/app/components/tracks-page/tracks-page.ts` | signals `error`, `total`, `limit` ; garde-fous dans `go()` ; `onPage()` pour le paginator |
| `src/app/components/tracks-page/tracks-page.html` | message d'erreur, **paginator Material** à la place des boutons maison |
| `src/app/components/tracks-page/tracks-page.css` | empêche le style vert global d'écraser les boutons du paginator |
| `src/app/shared/material/paginator-intl.ts` | **créé** — libellés français du paginator |
| `src/main.ts` | fournit ces libellés |
| `angular.json`, `package.json` | thème Material `azure-blue` + dépendances `@angular/material` et `@angular/cdk` |

`track.service.ts` a été **vérifié sans être modifié** : `list(page, limit)` transmet déjà les
deux paramètres.

---

## 2. Les points à savoir expliquer

**TP1**

- **Deux intercepteurs** : `authInterceptor` pose le jeton à l'aller, `errorInterceptor` traite le `401` au retour.
- **Pourquoi exclure `/api/auth/`** du `401` : sinon un mot de passe faux redirigerait vers `/login`, effaçant son propre message d'erreur.
- **Pourquoi `restoreSession()` est appelée depuis `AppComponent`** et pas dans le constructeur du service : sinon dépendance circulaire, l'intercepteur réclamant un service encore en construction.
- **Signal vs `localStorage`** : le signal est réactif mais meurt au F5 ; `localStorage` survit mais ne prévient personne. D'où l'écriture aux deux endroits, et `restoreSession()` pour reconstruire `currentUser`.
- **Le garde de route n'est pas une sécurité** : il vérifie la présence du jeton, pas sa validité. La vraie protection est le middleware `auth` du backend.

**TP2**

- **Pagination serveur** : chaque changement de page envoie `GET /api/tracks?page=…&limit=…`. Aucune liste complète n'est gardée en mémoire — le sujet l'interdit.
- **Décalage du paginator** : son `pageIndex` commence à 0, l'API numérote à partir de 1, d'où le `+1` dans `onPage()`.
- **Changer la taille de page** remet la page à 1, sinon on pourrait demander une page qui n'existe plus.
- **Coût de Material** : le bundle passe de 298 ko à 566 ko (79 → 132 ko transférés).

---

## 3. Vérifications déjà faites

| Test | Résultat |
|---|---|
| `npm run build` | ✅ aucune erreur ni avertissement |
| Non connecté sur `/tracks` | ✅ redirigé vers `/login` |
| Email invalide | ✅ message affiché, bouton désactivé |
| Jeton invalide + F5 | ✅ `401`, `localStorage` vidé, retour `/login` (backend : `[auth] Token invalide ou expiré`) |
| Backend coupé (erreur réseau) | ✅ **pas** de déconnexion : seul un `401` la déclenche |
| Bouton Déconnexion | ✅ état vidé, retour `/login`, navigation remise à zéro |
| API injoignable sur `/tracks` | ✅ « Chargement de la bibliothèque impossible » affiché |
| Pagination (testée sur une fausse API de 12 pistes) | ✅ « Page suivante » → `page=2&limit=5` ; passage à 10 par page → `page=1&limit=10` |
| Style du paginator | ✅ boutons Material ronds et transparents, pas écrasés par le vert du projet |

Restent à faire par le binôme, car ils demandent le mot de passe du compte démo : connexion
réussie, modification du profil, upload.

---

## 4. Checkpoints

### TP1 — trois requêtes à capturer

| Scénario | Attendu |
|---|---|
| Connexion réussie | `POST /api/auth/login` → `200`, **sans** en-tête `Authorization` ; la requête suivante (`/api/tracks`) en a un |
| Connexion refusée | `POST /api/auth/login` → `401 Identifiants incorrects`, on reste sur `/login`, `localStorage` vide |
| Profil | `GET` puis `PUT /api/users/me` → `200`, avec `Authorization`, le nom change aussi dans l'en-tête |

Bonus : modifier `gpc_token` dans l'onglet Application puis recharger → `401`, nettoyage, retour `/login`.

### TP2 — pagination

Il faut **plus de 5 pistes** (en envoyer 6, ou passer `limit` à 2 le temps du test).

| Action | Attendu |
|---|---|
| Arrivée sur `/tracks` | `GET /api/tracks?page=1&limit=5` → `200` |
| « Page suivante » | nouvelle requête avec `page=2` |
| « Pistes par page » → 10 | nouvelle requête `page=1&limit=10` |

### ⚠️ Avant toute capture d'écran

Masquer : l'onglet **Payload** de `login`/`register` (mot de passe), l'onglet **Response** de
ces mêmes requêtes (jeton), l'en-tête **`Authorization`**, et la clé `gpc_token`.

---

## 5. Réponses aux questions du TP1

**Quel modèle IA ?** Claude Opus 5 (`claude-opus-5`), dans Claude Code, application de bureau.
La commande `/model` permet d'en changer. Le contexte fourni (fichiers du projet, `AGENTS.md`,
`API_CONTRACT.md`) compte autant que le modèle.

**Combien de tokens consommés ?** Un token ≈ 4 caractères. Dans Claude Code : `/cost` pour la
session, `/usage` pour les limites de l'abonnement. Sur l'API : l'objet `usage`
(`input_tokens`, `output_tokens`) de chaque réponse, et la console de facturation. Faire lire
un fichier de 500 lignes coûte quelques milliers de tokens : mieux vaut cibler les fichiers
utiles.

**Qui conseille le meilleur modèle ?** Personne dans l'absolu. Par ordre d'utilité : la
documentation du fournisseur, **votre propre essai sur votre tâche**, l'assistant lui-même
(qui n'est pas neutre), l'enseignant, puis les classements publics (LMArena, SWE-bench), qui
ne disent rien de votre cas. Règle simple : modèle rapide pour une question simple, modèle
capable pour du raisonnement sur plusieurs fichiers ou du débogage.

**Quelles routes backend sont utilisées ?** 7 sur 9.

| Route | Appelée par |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` | `auth.service.ts` (publiques) |
| `GET` et `PUT /api/users/me` | `auth.service.ts` |
| `GET /api/tracks` · `POST /api/tracks` · `GET /api/tracks/:id/audio` | `track.service.ts` |

Non utilisées : `GET /api/health` (vérification serveur) et `DELETE /api/tracks/:id` (bonus).

**Où se fait la mise à jour du profil ?**

| Côté | Fichier |
|---|---|
| Front | `profile-page.html` (formulaire) → `profile-page.ts` `save()` → `auth.service.ts` `update()` → `auth.interceptor.ts` (jeton) |
| Back | `backend/src/app.js` ligne 249 (`app.put("/api/users/me", auth, …)`) → `backend/src/models/User.js` (validation, `toPublic()`) |

Point clé : le backend modifie l'utilisateur du **JWT** (`req.auth.sub`), jamais un id envoyé
par le client, et n'écrit que le champ `name`.

---

## 6. Reste à faire

- [ ] les captures Network des deux checkpoints ;
- [ ] joindre le schéma du flux de connexion (`flux-connexion.png` / `.svg`) ;
- [ ] compléter `RAPPORT_IA_MODELE.md` (prompts, vérifications du binôme, preuves) ;
- [ ] **TP2 Mission 3** : upload et lecture audio — validation du fichier avant envoi, états d'envoi, cards, révocation de l'`ObjectURL` à la destruction du composant, questions mémoire/buffering/streaming ;
- [ ] corriger l'affichage de la taille : le template affiche `Ko` alors que l'API renvoie des **octets** (Mission 3).
