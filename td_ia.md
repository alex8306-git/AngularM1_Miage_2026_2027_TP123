# TD IA — Mission 1 du TP1, jusqu'au checkpoint

Ce document décrit **les changements appliqués**, **les chemins des fichiers concernés**, la
façon de réaliser le checkpoint, puis **les réponses aux questions** du sujet. Le code
lui-même est dans les fichiers du projet, pas ici.

## État

Les modifications sont **appliquées** à `frontend-starter/` et la compilation passe
(`npm run build`, aucune erreur ni avertissement). Le comportement a été vérifié dans un
navigateur, voir la [section Vérifications](#5-vérifications-effectuées).

Aucun fichier de `backend/` n'a été touché : le sujet et les consignes du dépôt l'interdisent.
Le contrat HTTP de `API_CONTRACT.md` est inchangé, aucune route n'a été ajoutée ni modifiée.

Volume du changement : **11 fichiers, 211 lignes ajoutées, 33 supprimées.**

---

## 1. Récapitulatif des fichiers

| # | Chemin | Action | Exigence du sujet couverte |
|---|---|---|---|
| 1 | `frontend-starter/src/app/shared/interceptors/error.interceptor.ts` | **créé** | « gestion d'un `401`, avec retour vers `/login` si le token est invalide ou expiré » |
| 2 | `frontend-starter/src/main.ts` | modifié | enregistrement du nouvel intercepteur |
| 3 | `frontend-starter/src/app/shared/services/auth.service.ts` | modifié | « mise à jour du Signal `currentUser` », y compris après un rechargement |
| 4 | `frontend-starter/src/app/components/app/app.ts` | modifié | « bouton de déconnexion avec nettoyage de l'état local » |
| 5 | `frontend-starter/src/app/components/app/app.html` | modifié | navigation cohérente avec l'état d'authentification |
| 6 | `frontend-starter/src/app/components/login-page/login-page.ts` | modifié | « validations et messages d'erreur compréhensibles » |
| 7 | `frontend-starter/src/app/components/login-page/login-page.html` | modifié | idem |
| 8 | `frontend-starter/src/app/components/register-page/register-page.ts` | modifié | idem, avec des règles alignées sur le backend |
| 9 | `frontend-starter/src/app/components/register-page/register-page.html` | modifié | idem |
| 10 | `frontend-starter/src/app/components/profile-page/profile-page.ts` | modifié | « chargement de `/api/users/me` lorsque le profil est demandé » |
| 11 | `frontend-starter/src/app/components/profile-page/profile-page.html` | modifié | idem, et erreurs visibles par l'utilisateur |

Ce qui était **déjà conforme** et n'a pas été touché : les formulaires réactifs, les appels
`/api/auth/register` et `/api/auth/login`, la sauvegarde du JWT sans jamais l'afficher dans
les logs, les redirections après succès, le `PUT /api/users/me`, l'usage d'`inject()`, et le
fait qu'aucun composant n'utilise `HttpClient` directement.

---

## 2. Ce qui a changé, fichier par fichier

### 2.1 Fichier créé : `shared/interceptors/error.interceptor.ts`

C'est la pièce qui manquait. L'intercepteur existant regardait les requêtes **à l'aller** ;
celui-ci regarde les réponses **au retour**. Sur un `401` reçu ailleurs que sur une route
d'authentification, il appelle `logout()` puis redirige vers `/login`.

Trois points à savoir expliquer :

- **l'exclusion de `/api/auth/`** : sans elle, un mot de passe faux provoquerait une redirection vers `/login` alors qu'on y est déjà, et le message d'erreur serait effacé au passage ;
- **l'erreur est relancée** après traitement : elle poursuit son chemin jusqu'au `subscribe` du composant, qui reste libre de l'afficher. L'intercepteur ne l'avale pas ;
- **pourquoi un intercepteur** plutôt qu'un test dans chaque composant : le traitement est écrit une seule fois et couvre les sept appels de l'application.

### 2.2 `main.ts`

Le nouvel intercepteur est ajouté au tableau de `withInterceptors([...])`. L'ordre du tableau
est l'ordre de la chaîne : la requête traverse `authInterceptor` (qui pose le jeton) puis
`errorInterceptor`, et la réponse revient dans l'autre sens.

### 2.3 `shared/services/auth.service.ts`

Trois ajouts :

- **`isLoggedIn`**, un `computed()` dérivé de `token()`. Un seul endroit définit « être connecté », ce qui évite que la navigation et le garde divergent un jour ;
- **`restoreSession()`**, qui corrige le problème du rechargement : le jeton survit dans `localStorage`, mais le signal `currentUser` repart à `null`. La méthode redemande `/api/users/me` pour reconstruire l'état. Si le jeton est expiré, le `401` est pris en charge par le nouvel intercepteur ;
- une trace dans `logout()`, utile pour suivre le nettoyage dans la console.

> **Pourquoi `restoreSession()` n'est-elle pas appelée dans le constructeur du service ?**
> Le constructeur déclencherait un appel HTTP pendant la construction d'`AuthService` ;
> l'intercepteur, qui fait `inject(AuthService)`, réclamerait alors un service encore en cours
> de construction — c'est une dépendance circulaire. On l'appelle donc depuis `AppComponent`,
> créé **après** les services.

### 2.4 et 2.5 `components/app/app.ts` et `app.html`

- Le composant racine injecte `AuthService` et expose une méthode `logout()` : nettoyage de l'état local puis navigation vers `/login`.
- Il appelle `restoreSession()` dans son constructeur, au démarrage de l'application.
- La navigation est devenue conditionnelle : connecté, elle affiche « Backing tracks », « Profil », le nom de l'utilisateur et le bouton « Déconnexion » ; déconnecté, « Connexion » et « Créer un compte ».
- `auth` est déclaré `readonly` **sans** `private`, sinon le template ne pourrait pas le lire.

C'est la démonstration visible des Signals : `logout()` fait `token.set(null)`, et la
navigation bascule toute seule, sans qu'aucune ligne ne touche au DOM.

### 2.6 et 2.7 `components/login-page/`

- **Messages d'erreur par champ**, affichés seulement une fois le champ *touché*, pour ne pas crier à l'erreur avant que l'utilisateur ait commencé à taper. Chaque message est marqué `role="alert"` afin d'être annoncé par un lecteur d'écran.
- **Bouton désactivé** tant que le formulaire est invalide ou qu'un envoi est en cours.
- Un signal `submitting` **empêche le double envoi** et change le libellé du bouton pendant l'appel.
- `markAllAsTouched()` fait apparaître tous les messages d'un coup si l'on force la soumission.
- Le **mot de passe pré-rempli a été retiré** : les consignes du dépôt interdisent un mot de passe dans le code Angular. L'email de démonstration reste pré-rempli, et le mot de passe figure dans le `README.md`.
- Le `console.error` ne journalise plus que le **statut** de l'erreur, pas l'objet complet.

### 2.8 et 2.9 `components/register-page/`

Mêmes changements que la page de connexion, plus l'alignement des règles sur le backend :
nom de **2 caractères minimum** (contrainte du schéma Mongoose) et mot de passe de
**8 caractères minimum** (contrôle de la route `register`).

L'utilisateur est ainsi prévenu immédiatement, mais le serveur reste seul juge : la validation
du navigateur est un confort, jamais une sécurité.

### 2.10 et 2.11 `components/profile-page/`

- Le profil se charge **dès l'arrivée sur la page** (dans le constructeur), sans attendre un clic : c'est la demande du sujet.
- Le bouton est conservé et renommé « Recharger mon profil » — pratique pour provoquer une requête `GET /api/users/me` à la demande pendant le checkpoint.
- Les erreurs de chargement et d'enregistrement sont désormais **affichées à l'écran**, plus seulement dans la console.
- Un message « Nom enregistré. » confirme la modification.
- Le champ nom a les mêmes règles que le backend, et le bouton est désactivé si le formulaire est invalide.

**Compromis assumé** : si l'on recharge la page (F5) en étant déjà sur `/profile`,
`GET /api/users/me` part **deux fois** — une fois par `restoreSession()`, une fois par la page.
L'alternative, ne charger que si `currentUser()` est `null`, supprimerait la requête attendue
par le sujet dans le cas le plus courant. Le doublon a donc été préféré, mais il faut savoir
l'expliquer.

---

## 3. Lancer l'application

```bash
cd backend
npm start
```

```bash
cd frontend-starter
npm start
```

Puis ouvrir `http://localhost:4200`. `ng serve` recompile et recharge le navigateur à chaque
sauvegarde. Pour vérifier que rien n'est cassé après une modification :

```bash
cd frontend-starter
npm run build
```

---

## 4. Le checkpoint : ce qu'il faut observer dans Network

Préparation : backend et frontend lancés, `F12`, onglet **Network**, filtre **Fetch/XHR**,
case « Preserve log » cochée pour ne rien perdre lors des redirections.

### 4.1 Une connexion réussie

Se connecter avec `demo@example.com` et le mot de passe indiqué dans le `README.md`.

| À relever | Valeur attendue |
|---|---|
| Méthode et URL | `POST http://localhost:4200/api/auth/login` |
| Corps envoyé | `{ email, password }` — **à ne pas capturer** |
| Statut | `200 OK` |
| Réponse | `{ token, user }` — **à ne pas capturer** |
| `Authorization` | **absent** : on n'a pas encore de jeton |

Puis regarder la requête suivante, `GET /api/tracks?page=1&limit=5` : elle porte cette fois un
en-tête `Authorization: Bearer …`. C'est la preuve que l'intercepteur fait son travail.

### 4.2 Une connexion refusée

Se déconnecter, puis retenter avec un mot de passe volontairement faux.

| À relever | Valeur attendue |
|---|---|
| Méthode et URL | `POST /api/auth/login` |
| Statut | `401 Unauthorized` |
| Réponse | `{ "message": "Identifiants incorrects" }` |
| Écran | le message rouge s'affiche, on **reste** sur `/login` |
| `localStorage` | toujours vide (onglet Application) |

### 4.3 Une lecture ou modification de `/api/users/me`

Se reconnecter, aller sur **Profil** : `GET /api/users/me` part tout seul. Changer le nom, puis
« Enregistrer » : `PUT /api/users/me` avec le corps `{ "name": "…" }`.

| À relever | Valeur attendue |
|---|---|
| Méthode et URL | `GET` puis `PUT /api/users/me` |
| `Authorization` | `Bearer …` présent sur les deux |
| Statut | `200 OK` |
| Réponse | l'objet `User`, sans `passwordHash` |
| Écran | le nom change **aussi dans l'en-tête**, sans rechargement |

### 4.4 Bonus très parlant : le jeton invalide

Onglet **Application** → Local Storage → modifier quelques caractères de `gpc_token`, puis
recharger la page. Résultat attendu : `401`, nettoyage de `localStorage`, retour automatique
sur `/login`. C'est exactement le comportement demandé par le sujet.

### ⚠️ Précautions pour les captures d'écran

Le sujet interdit de capturer ou de transmettre un mot de passe ou un JWT. Avant toute
capture, masquer ou recadrer :

- l'onglet **Payload** de `login` et `register` (mot de passe en clair) ;
- l'onglet **Response** de `login` et `register` (le jeton) ;
- l'en-tête **`Authorization`** (le jeton) ;
- la clé `gpc_token` dans l'onglet Application.

Ce qu'on peut montrer sans risque : la méthode, l'URL, le statut, la **présence** de la ligne
`Authorization` avec sa valeur floutée, et les corps de réponse de `/api/users/me`.

---

## 5. Vérifications effectuées

Les essais ont d'abord été menés sur une copie du frontend placée hors du projet, puis la
compilation a été refaite depuis le projet après application.

| Vérification | Résultat |
|---|---|
| `ng build` depuis `frontend-starter/` | ✅ aucune erreur ni avertissement — 297,84 ko |
| Visiteur non connecté sur `/tracks` | ✅ redirigé vers `/login`, navigation = « Connexion / Créer un compte » |
| Email invalide saisi puis champ quitté | ✅ « Format d'email invalide… » affiché, bouton désactivé |
| Jeton invalide dans `localStorage` puis rechargement | ✅ deux `401` (`/api/users/me` et `/api/tracks`), `localStorage` vidé, retour sur `/login` |
| Journal du backend pendant ce test | ✅ `[auth] Token invalide ou expiré` puis `[http] … -> 401` |
| Erreur **réseau** (backend arrêté) | ✅ **pas** de déconnexion : seul un `401` déclenche le retour au login |
| Clic sur « Déconnexion » | ✅ `localStorage` vidé, retour sur `/login`, navigation revenue à l'état déconnecté |

Non vérifié par l'assistant, à faire par le binôme : la connexion réussie et la modification du
profil, qui demandent de saisir le mot de passe du compte de démonstration. C'est précisément
l'objet du checkpoint.

---

## 6. Réponses aux questions du sujet

### 6.1 « Quel modèle utilisez-vous dans votre assistant IA ? »

Claude Opus 5 (identifiant technique `claude-opus-5`), utilisé dans Claude Code, application
de bureau, onglet Code. Un même outil peut proposer plusieurs modèles : dans Claude Code, la
commande `/model` affiche et change celui de la session.

À noter pour le rapport : le modèle n'est qu'une partie de la réponse. Le **contexte fourni**
— fichiers du projet, `AGENTS.md`, `best-practices.md`, `API_CONTRACT.md` — compte au moins
autant que le choix du modèle.

### 6.2 « Comment savoir combien vous avez consommé de tokens ? »

> **C'est quoi un token ?** L'unité de découpage du texte pour un modèle : environ 4
> caractères, soit à peu près trois quarts d'un mot. Tout est compté en tokens : ce qu'on
> envoie (*input*), ce que le modèle répond (*output*), et le contenu des fichiers lus.

| Situation | Où regarder |
|---|---|
| Claude Code | `/cost` donne les tokens et le coût de la session en cours ; `/usage` situe la consommation par rapport aux limites de l'abonnement |
| Claude Code | on peut aussi demander directement à l'assistant d'expliquer la consommation de la session |
| API Anthropic | chaque réponse contient un objet `usage` avec `input_tokens` et `output_tokens` ; la console de facturation donne le cumul |
| Autres outils | ChatGPT/Codex, Gemini CLI et Copilot ont leurs propres compteurs, dans leur interface ou leur console |

Ordre de grandeur utile : faire lire un fichier de 500 lignes coûte quelques milliers de tokens
en entrée. D'où une bonne pratique : demander la lecture des **fichiers pertinents**, pas du
dépôt entier.

### 6.3 « Qui peut vous conseiller quel est le meilleur modèle pour une tâche donnée ? »

Personne ne peut le dire dans l'absolu, et c'est la vraie réponse à donner. Par ordre
d'utilité :

1. **La documentation du fournisseur** : Anthropic, OpenAI et Google publient un comparatif de leurs modèles (capacités, vitesse, prix, taille de contexte), mis à jour à chaque sortie.
2. **Votre propre essai sur votre tâche** : faire traiter le même problème par deux modèles et comparer. C'est la seule mesure qui compte, parce qu'elle porte sur *votre* code.
3. **L'assistant lui-même**, à qui l'on peut demander si la tâche demande un modèle plus puissant — en sachant qu'il n'est pas neutre.
4. **L'enseignant et les autres binômes**, qui ont déjà éprouvé l'outil sur le même sujet.
5. **Les classements publics** (LMArena, SWE-bench…), utiles comme tendance générale, mais muets sur votre cas particulier.

Règle pratique : un modèle rapide et peu coûteux suffit pour de la reformulation ou une
question simple ; un modèle plus capable se justifie pour du raisonnement sur plusieurs
fichiers, du débogage ou une revue de code.

### 6.4 « Quelles sont les différentes routes du backend qui sont utilisées ? »

| Route | Utilisée pour | Fichier appelant |
|---|---|---|
| `POST /api/auth/register` | inscription | `auth.service.ts` → `register()` |
| `POST /api/auth/login` | connexion | `auth.service.ts` → `login()` |
| `GET /api/users/me` | affichage du profil, restauration de session | `auth.service.ts` → `profile()` |
| `PUT /api/users/me` | modification du nom | `auth.service.ts` → `update()` |
| `GET /api/tracks?page=&limit=` | liste paginée des pistes | `track.service.ts` → `list()` |
| `POST /api/tracks` | upload d'un fichier audio | `track.service.ts` → `upload()` |
| `GET /api/tracks/:id/audio` | lecture d'une piste | `track.service.ts` → `audio()` |

Soit **7 routes utilisées sur les 9** du contrat. Les deux autres :

- `GET /api/health` : existe côté serveur pour vérifier que l'API répond, mais n'est appelée par aucun code Angular ;
- `DELETE /api/tracks/:id` : prévue au contrat et implémentée dans le backend, mais `TrackService` n'a pas de méthode `delete()` et l'interface n'a pas de bouton. C'est le bonus du sujet.

Parmi ces 7 routes, **2 sont publiques** (`register`, `login`) et **5 sont protégées** par le
JWT.

### 6.5 « Où s'effectue la tâche "mise à jour du profil utilisateur", dans quels fichiers côté back et côté front ? »

| Côté | Fichier | Rôle précis |
|---|---|---|
| Front — interface | `frontend-starter/src/app/components/profile-page/profile-page.html` | le formulaire et son `(ngSubmit)="save()"` |
| Front — composant | `frontend-starter/src/app/components/profile-page/profile-page.ts` → `save()` | vérifie la validité, lit `form.getRawValue()`, délègue au service |
| Front — service | `frontend-starter/src/app/shared/services/auth.service.ts` → `update()` | émet le `PUT /api/users/me` et met `currentUser` à jour via `tap()` |
| Front — infrastructure | `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts` | ajoute l'en-tête `Authorization: Bearer …` |
| Back — route | `backend/src/app.js`, ligne 249 : `app.put("/api/users/me", auth, …)` | middleware `auth`, puis `User.findByIdAndUpdate` avec `$set: { name }` |
| Back — modèle | `backend/src/models/User.js` | valide le nom (2 caractères minimum) et construit la réponse avec `toPublic()` |

Détail à souligner à l'oral : le backend n'utilise **jamais** un identifiant envoyé par le
client. Il modifie l'utilisateur désigné par `req.auth.sub`, c'est-à-dire celui du JWT.
Impossible donc de renommer le compte de quelqu'un d'autre. Et seul le champ `name` est écrit :
un `email` ou un `password` envoyés dans le corps seraient ignorés.

### 6.6 Livrable du TP1 : différence entre un Signal et `localStorage`

| | Signal | `localStorage` |
|---|---|---|
| Où vit la donnée | en mémoire, dans le JavaScript de la page | sur le disque, géré par le navigateur |
| Durée de vie | disparaît à chaque rechargement | survit au rechargement et à la fermeture |
| Réactif | **oui** : l'écran se met à jour tout seul | **non** : personne n'est prévenu |
| Contenu | n'importe quel objet | du texte uniquement |
| Dans le projet | `currentUser`, `token`, `isLoggedIn` | la clé `gpc_token` |

C'est pour cela que la sauvegarde de session écrit **aux deux endroits**, et que
`restoreSession()` existe : au démarrage, le jeton est relu depuis `localStorage`, mais
`currentUser` doit être reconstruit par un appel à `/api/users/me`.

---

## 7. Ce qui reste à produire pour le TP1

- [ ] réaliser le checkpoint de la section 4 et capturer les trois requêtes, jetons et mots de passe masqués ;
- [ ] joindre le schéma annoté du flux de connexion (déjà généré : `flux-connexion.png` / `.svg`) ;
- [ ] compléter `RAPPORT_IA_MODELE.md` : prompts utilisés, vérifications faites par le binôme, propositions refusées, preuves ;
- [ ] savoir expliquer sans l'assistant : le rôle de chacun des deux intercepteurs, pourquoi le garde de route ne suffit pas, et pourquoi la validation du formulaire ne remplace pas celle du serveur.
