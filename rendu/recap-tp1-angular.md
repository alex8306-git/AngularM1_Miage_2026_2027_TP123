# Récap TP1 — Guitar Practice Cloud (Angular + Node/Express/MongoDB)

Récapitulatif des notions vues, dans l'ordre où on les a abordées.

---

## 1. Architecture générale : pourquoi Mongo côté back

Le front (Angular) tourne dans le navigateur de l'utilisateur. Tout son code est visible via F12. Si l'URI MongoDB (qui contient login + mot de passe) y était, n'importe qui pourrait la voler.

Le back (Node/Express) tourne sur un serveur que toi seul contrôles. Lui seul connaît l'URI Mongo.

**Le flux :**

1. Angular fait un appel HTTP vers `http://localhost:3000/api/...`
2. Express reçoit, valide, interroge MongoDB via Mongoose
3. Express renvoie du JSON
4. Angular affiche

Le front ne parle **jamais** directement à Mongo.

---

## 2. Mongoose

Bibliothèque qui se pose par-dessus MongoDB, côté back. Elle permet de définir des **schémas** :

```js
const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
```

Avantages :
- Validation automatique (impossible d'enregistrer un document mal formé)
- Syntaxe simple : `User.findOne({ email: ... })`
- Models (`User`, `Track`) qui représentent les collections Mongo

### Relations entre collections

MongoDB n'a pas de jointures natives. On stocke l'**ObjectId** d'un document dans un autre, puis on utilise `.populate()` pour récupérer les données complètes :

```js
const track = await Track.findById(id).populate('owner');
```

Sans `populate()`, tu récupères juste l'id brut. Différence avec SQL : ici tu choisis explicitement quand "joindre".

---

## 3. Le fichier `.env`

Contient les infos secrètes : URI MongoDB, secret JWT. Le code les lit via `process.env.NOM_VARIABLE`.

**Jamais sur Git** : si tu push `.env`, tes secrets deviennent publics (et restent dans l'historique Git même après suppression).

Le repo fournit un `.env.example` (structure sans les vraies valeurs). Le vrai `.env` est dans `.gitignore`.

---

## 4. Routes et endpoints REST

### C'est quoi une route

Une route = une **URL** + une **méthode HTTP** + une **fonction** qui s'exécute.

```js
app.get('/api/tracks', (req, res) => {
  res.json({ message: "Liste des tracks" });
});
```

Méthodes : `GET` = lire, `POST` = créer, `PUT/PATCH` = modifier, `DELETE` = supprimer.

### API_CONTRACT.md

Document qui décrit précisément comment communiquer avec l'API : pour chaque route, l'URL, la méthode, le body attendu, la réponse renvoyée, les codes de statut possibles.

C'est un accord entre back et front. Dans un vrai projet, il est écrit **avant** de coder, pour que les deux avancent en parallèle.

**Réflexe** : avant de coder un appel HTTP côté Angular, vérifier le contrat plutôt que deviner.

---

## 5. Structure du back : routers et contrôleurs

**Router** : regroupe les routes d'une même ressource.

```js
// routes/tracks.js
const router = express.Router();
router.get('/', trackController.getAll);
router.post('/', trackController.create);
module.exports = router;
```

```js
// app.js
app.use('/api/tracks', tracksRouter);
```

**Contrôleur** : contient la vraie logique.

```js
// controllers/trackController.js
exports.getAll = async (req, res) => {
  const tracks = await Track.find();
  res.json(tracks);
};
```

Structure typique :

```
routes/       → définit les URLs
controllers/  → contient la logique
models/       → schémas Mongoose
middlewares/  → auth, multer, etc.
```

---

## 6. Middlewares Express

Fonction qui s'exécute **entre** la réception d'une requête et l'envoi de la réponse. Accès à `req`, `res`, `next`.

```js
function logger(req, res, next) {
  console.log(req.method, req.url);
  next(); // sans ça, la requête reste bloquée
}
```

Middlewares courants dans le projet :
- **Multer** : extrait les fichiers uploadés
- **Auth** : vérifie le JWT, bloque avec `401` si invalide
- **`express.json()`** : transforme le body JSON en objet JS (`req.body`)
- **Gestion d'erreurs** : capture les erreurs et renvoie une réponse propre

---

## 7. Authentification

### bcrypt (hachage des mots de passe)

Un mot de passe ne doit **jamais** être stocké en clair.

```js
const hash = await bcrypt.hash(password, 10);  // inscription
const isValid = await bcrypt.compare(password, user.hashedPassword);  // connexion
```

- Le hachage est **irréversible** — on ne peut pas "déhacher", on compare les hash
- Le **salt** (valeur aléatoire ajoutée) fait que deux utilisateurs avec le même mot de passe ont des hash différents
- Le "10" (salt rounds) contrôle le nombre de boucles — plus c'est élevé, plus c'est lent, plus la force brute est coûteuse

### JWT (JSON Web Token)

Chaîne en 3 parties : `header.payload.signature`

- **Header** : algorithme de signature utilisé
- **Payload** : infos utiles (id utilisateur, email, expiration `exp`). **Lisible par tous** — jamais de mot de passe dedans
- **Signature** : générée avec le secret du `.env`. Garantit que le token n'a pas été modifié

**Flux** : login réussi → back génère le JWT → front le stocke → front l'envoie dans `Authorization: Bearer <token>` à chaque requête protégée → back vérifie la signature.

Le token a une **expiration** (ex: 1h, 24h). Passé ce délai, reconnexion nécessaire.

### Stockage du token côté front

| | En mémoire (variable JS) | `localStorage` |
|---|---|---|
| Survit au F5 | Non | Oui |
| Confort | Reconnexion à chaque refresh | Pas de reconnexion |
| Sécurité | Plus sûr | Lisible par tout script JS (risque XSS) |

Alternative plus sûre : cookie `httpOnly` (invisible au JavaScript), mais config back différente.

---

## 8. MongoDB Atlas

MongoDB hébergé dans le cloud — rien à installer localement.

1. Créer un compte et un "cluster" (gratuit pour un usage étudiant)
2. Récupérer l'**URI de connexion** : `mongodb+srv://user:motdepasse@cluster.mongodb.net/madb`
3. Mettre cette URI dans le `.env` du back
4. Configurer l'**IP whitelist** (quelles IP ont le droit de se connecter) et un utilisateur/mot de passe dédié

Voir `ATLAS_SETUP.md` dans le repo.

---

## 9. Codes de statut HTTP

**2xx = succès**
- `200 OK` : tout s'est bien passé
- `201 Created` : ressource créée (après un `POST`)

**4xx = erreur côté client**
- `400 Bad Request` : données mal formées
- `401 Unauthorized` : pas connecté / token invalide
- `403 Forbidden` : connecté mais pas le droit
- `404 Not Found` : ressource inexistante

**5xx = erreur côté serveur**
- `500 Internal Server Error` : plantage interne

```js
if (!track) {
  return res.status(404).json({ message: "Track introuvable" });
}
res.status(200).json(track);
```

Le front se base sur ces codes pour réagir : `401` → redirection login, `404` → "non trouvé", etc.

---

## 10. CORS

Le navigateur applique la **same-origin policy** : une page sur `localhost:4200` n'a pas le droit d'appeler `localhost:3000` (port différent = origine différente), sauf autorisation explicite.

**CORS** = le mécanisme par lequel le serveur autorise certaines origines.

```js
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:4200' }));
```

Sans ça : erreur `blocked by CORS policy` dans la console du navigateur.

Ce n'est pas une protection contre les hackers, c'est une règle de navigateur pour éviter qu'un site malveillant fasse des requêtes cachées vers d'autres sites avec la session d'un utilisateur.

---

## 11. Tester avec Postman / Insomnia

Envoyer des requêtes HTTP manuellement, sans passer par le front.

Pour une route protégée :
1. `POST /api/auth/login` avec email/mot de passe → récupérer le token
2. Copier le token
3. Ajouter le header `Authorization: Bearer <token>`
4. Envoyer la requête → JSON attendu, pas de `401`

**Pourquoi** : si ça marche dans Postman mais pas dans Angular, le problème vient du front (ou de CORS), pas du back. Ça isole les sources de bugs.

---

## 12. Architecture Angular

```
Router  →  Composant  →  Service  →  Backend Express  →  MongoDB
```

- **Router** : choisit quel composant afficher selon l'URL (sans recharger la page — SPA)
- **Composant** : template HTML + classe (logique d'affichage)
- **Service** : logique métier + appels HTTP via `HttpClient`

Le composant ne fait **jamais** d'appel HTTP directement.

### Injection de dépendances

Le composant déclare ce dont il a besoin, Angular le fournit :

```ts
@Injectable({ providedIn: 'root' })
export class TrackService { ... }
```

```ts
export class TrackListComponent {
  constructor(private trackService: TrackService) {}
}
```

`providedIn: 'root'` = une seule instance partagée dans toute l'app (singleton).

Utile pour les tests : on peut injecter un faux service (mock) sans toucher au composant.

---

## 13. Afficher des données dans un composant

**Interpolation** :
```html
<p>{{ track.title }}</p>
```

**`*ngFor`** :
```html
<li *ngFor="let track of tracks">{{ track.title }}</li>
```

**Gérer l'asynchrone** — deux options :

Option A, `subscribe()` :
```ts
ngOnInit() {
  this.trackService.getTracks().subscribe(data => {
    this.tracks = data;
  });
}
```

Option B, `async pipe` (plus propre, se désabonne tout seul) :
```ts
tracks$ = this.trackService.getTracks();
```
```html
<li *ngFor="let track of tracks$ | async">{{ track.title }}</li>
```

---

## 14. Observables (RxJS) vs Promises

| | Promise | Observable |
|---|---|---|
| Nombre de valeurs | Une seule | Zéro, une ou plusieurs dans le temps |
| Démarre quand | Immédiatement | Au `.subscribe()` |
| Annulable | Non | Oui (`.unsubscribe()`) |
| Opérateurs | Non | Oui (`map`, `filter`, `debounceTime`...) |

Pourquoi Angular les utilise pour `HttpClient` :
- **Annulation** : si l'utilisateur quitte la page avant la fin de la requête
- **Flux continus** : recherche en temps réel, websockets, événements
- **Opérateurs** : `debounceTime(300)` pour attendre que l'utilisateur arrête de taper

Tant que tu ne fais pas `.subscribe()` (ou `| async`), **aucune requête n'est envoyée** — différence importante avec `fetch()`.

---

## 15. Guards (protéger les routes Angular)

Fonction qui s'exécute **avant** qu'une route soit chargée.

```ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};
```

```ts
{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
```

**Important** : le guard protège juste la navigation côté front. Ça ne remplace **jamais** la vérification côté back (middleware auth). Un utilisateur malin peut contourner le guard, pas le back.

---

## 16. Intercepteurs HTTP

Fonction qui s'insère automatiquement sur **toutes** les requêtes sortantes. Évite de répéter le même code partout.

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

```ts
provideHttpClient(withInterceptors([authInterceptor]))
```

Peut aussi gérer les erreurs de façon centralisée (ex: rediriger vers login sur tout `401`).

---

## 17. Gestion d'erreurs côté Angular

```ts
this.trackService.getTracks().subscribe({
  next: (data) => { this.tracks = data; },
  error: (err) => {
    if (err.status === 401) {
      this.router.navigate(['/login']);
    } else {
      console.error('Erreur:', err.status);
    }
  }
});
```

Sans gestion d'erreur, un token expiré ferait planter silencieusement les appels — rien ne s'afficherait sans explication.

---

## 18. Formulaires réactifs

Structure définie dans le TypeScript, pas dans le HTML.

```ts
loginForm = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', Validators.required)
});
```

```html
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <input formControlName="email" type="email">
  <input formControlName="password" type="password">
  <button [disabled]="loginForm.invalid">Se connecter</button>
</form>
```

Avantages : validation intégrée, `loginForm.invalid` pour désactiver le bouton, messages d'erreur ciblés via `loginForm.get('email')?.errors`.

---

## 19. Upload de fichiers

### Côté Angular

```html
<input type="file" (change)="onFileSelected($event)">
```

```ts
onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    this.selectedFile = input.files[0];
  }
}

uploadTrack() {
  const formData = new FormData();
  formData.append('audio', this.selectedFile!);  // doit matcher ce qu'attend Multer
  formData.append('title', this.trackTitle);

  this.http.post('http://localhost:3000/api/tracks', formData).subscribe(...);
}
```

**Ne jamais fixer manuellement `Content-Type`** sur une requête `FormData` — le navigateur génère un "boundary" nécessaire. Le forcer casse l'upload.

### Barre de progression

```ts
const req = new HttpRequest('POST', '/api/tracks', formData, {
  reportProgress: true
});

this.http.request(req).subscribe(event => {
  if (event.type === HttpEventType.UploadProgress) {
    this.progress = Math.round(100 * event.loaded / event.total!);
  } else if (event.type === HttpEventType.Response) {
    console.log('Upload terminé', event.body);
  }
});
```

### Côté back : Multer

Middleware Express qui extrait le fichier et le rend disponible dans `req.file`.

Le nom du champ doit correspondre : `formData.append('audio', ...)` ↔ `upload.single('audio')`.

---

## 20. Sécuriser l'upload

### Filtrer le type de fichier

Ne jamais faire confiance au front : on peut renommer un `.exe` en `.mp3`.

```js
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers mp3 sont autorisés'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }  // 10 Mo max
});
```

`file.mimetype` vient du navigateur, donc falsifiable en théorie. Pour une vraie sécurité, vérifier les "magic bytes" (premiers octets du fichier). Pour un TP, mimetype + extension suffit.

### Éviter les collisions de noms

Si deux utilisateurs uploadent `demo.mp3` en même temps, le second écraserait le premier. Solution : générer un nom unique.

```js
filename: (req, file, cb) => {
  cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`);
}
```

### Quota et rate limiting

**Quota** (limite métier) :
```js
const count = await Track.countDocuments({ owner: req.user.id });
if (count >= 20) {
  return res.status(403).json({ message: "Quota atteint" });
}
```

**Rate limiting** (anti-abus technique) :
```js
const rateLimit = require('express-rate-limit');
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/tracks', uploadLimiter);
```

---

## 21. Où est stocké le fichier

**Option A — disque local** (`diskStorage`) : écrit physiquement dans un dossier du serveur (ex: `uploads/`). Simple, suffisant pour un TP.

**Option B — cloud** (S3, Cloudinary) : le back reçoit via Multer puis renvoie vers un service externe, et ne garde que l'URL en base. Plus scalable, plus complexe.

Dans les deux cas, **MongoDB ne stocke jamais le fichier audio** — seulement les métadonnées : titre, chemin/URL, propriétaire, date.

### Servir le fichier au client

Option simple :
```js
app.use('/uploads', express.static('uploads'));
```
→ accessible via `http://localhost:3000/uploads/track123.mp3`, lisible dans `<audio [src]="track.url" controls>`.
Limite : accessible à quiconque connaît l'URL, sans vérification du JWT.

Option sécurisée :
```js
app.get('/api/tracks/:id/audio', authMiddleware, async (req, res) => {
  const track = await Track.findById(req.params.id);
  if (track.owner !== req.user.id) return res.status(403).send();
  res.sendFile(path.join(__dirname, 'uploads', track.filename));
});
```

---

## 22. Ce que le client voit en inspectant la page

**Visible :**
- Onglet **Network** : la requête `POST`, son URL, les headers (dont le token JWT en clair), le contenu du `FormData` (nom du champ, nom du fichier, taille)
- Le mp3 lui-même dans le payload de la requête
- La réponse du serveur
- Onglet **Application/Storage** : le token si stocké en `localStorage`

**Jamais visible :**
- Le code source du back (routes, logique Multer)
- Le fichier `.env` et les secrets

Seul ce qui transite réellement sur le réseau est inspectable.

---

## 23. Gestion d'erreurs côté back

### `try/catch` avec `async/await`

```js
exports.getTrack = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: "Introuvable" });
    }
    res.status(200).json(track);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
```

Sans `try/catch`, une erreur peut faire planter Node ou laisser la requête sans réponse — le front resterait en attente indéfiniment.

### Middleware d'erreurs global

Signature à **4 paramètres** (`err, req, res, next`) — c'est ce qui le distingue.

```js
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Erreur serveur"
  });
}
```

Déclaré **en dernier**, après toutes les routes :
```js
app.use('/api/tracks', tracksRouter);
app.use(errorHandler);
```

Les contrôleurs transmettent l'erreur avec `next(err)`. Avantage : format d'erreur cohérent partout, un seul endroit à modifier.

Pour un premier TP, des `try/catch` locaux suffisent — le middleware global est une amélioration à ajouter ensuite.

---

## Pistes non encore abordées

- Comment structurer un message d'erreur cohérent pour le front
- Validation de données avant le contrôleur (Joi, express-validator)
- Faille XSS concrètement, avec exemple
- Bien utiliser un assistant IA pour ce TP (`CONSEILS_POUR_UTILISER_ASSISTANT_AI.md`)
- Déboguer quand Postman marche mais pas Angular
