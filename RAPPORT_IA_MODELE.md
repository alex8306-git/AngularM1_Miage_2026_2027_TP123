# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

Prompt pour comprendre gloabalement (suggestions de questions à la fin de la réponse) :
La connexion à Mongo se fait dans le back ou le front, et pourquoi ?
C'est quoi Mongoose et pourquoi pas des requêtes Mongo "brutes" ?
Comment fonctionne le fichier .env et pourquoi il ne doit jamais être sur Git ?
Qu'est-ce qu'un endpoint REST et comment lire l'API_CONTRACT.md ?
Comment Angular structure une requête HTTP (services, HttpClient) ?
C'est quoi le rôle de Multer (uploads de fichiers audio) ?
Comment fonctionne le JWT en détail (contenu, expiration, sécurité) ?
Comment MongoDB Atlas fonctionne concrètement ?
C'est quoi un middleware Express en général ?
Comment structurer les routes Express (routers, contrôleurs) ?
C'est quoi les codes de statut HTTP et comment bien les utiliser ?
Différence entre localStorage et stockage en mémoire pour le token JWT ?
Comment Mongoose gère les relations entre collections ?
Pourquoi bcrypt pour hasher les mots de passe, et comment ça marche ?
Comment Angular sait qu'un utilisateur est connecté (AuthGuard) ?
C'est quoi CORS et pourquoi front (4200) et back (3000) en ont besoin ?
Comment tester une route avec Postman/Insomnia + rappel : c'est quoi une route ?
C'est quoi un API contract ?
Comment Angular fonctionne (avec schéma) ?
C'est quoi l'injection de dépendances en Angular ?
Comment un composant affiche des données (binding, *ngFor, async pipe) ?
C'est quoi un Observable (RxJS) et pourquoi pas juste une Promise ?
C'est quoi un intercepteur HTTP en Angular ?
Comment gérer les erreurs d'une requête HTTP côté Angular ?
C'est quoi un FormGroup/ReactiveFormsModule ?
Comment fonctionne l'upload d'un fichier depuis Angular vers Multer (FormData) ?
Comment afficher une barre de progression pendant l'upload ?
Que se passe-t-il quand on upload le mp3, et que voit le client s'il inspecte la page ?
Comment protéger le type de fichier uploadé côté back ?
Où le fichier mp3 est-il réellement stocké ?
Comment servir le mp3 au client une fois uploadé ?
C'est quoi une race condition si deux utilisateurs uploadent en même temps ?
Comment limiter le nombre d'uploads (quota, rate limiting) ?
C'est quoi try/catch avec async/await et pourquoi c'est important dans les routes Express ?
C'est quoi un middleware de gestion d'erreurs global en Express ?

est ce que le jwt passe par la fonction de hash?
c'est quoi les fichiers .ts?

analyse le backend, je veux comprendre l'architecture, les workflows, les technologies et les modules utilisés, comment est géré l'authentification... et fais une phrase pour dire ce que c'est avant d'expliquer (c'est quoi un workflow...)
à la fin, rajoute les améliorations possibles et pourquoi
rajoute un fichier le backend .md, met des schemas pour mieux comprendre

pour les points c'est normal qu'il y a que du front, la racine c'est pas dans le server (back)?

fais la mission 1 jusqu'au checkpoint, fabrique un fichier avec le changement que tu dois faire, le ou les chemins du fichier modifie et reponds en dessous aux questions (appelle le fichier, td_ia)