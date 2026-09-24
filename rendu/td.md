mission 0

le composant racine
app.ts qui est appelé dans main.ts

la configuration des routes
route.ts

l’enregistrement de HttpClient
provideHttpClient(withInterceptors([authInterceptor]))

les modèles, services et pages
Modèles     frontend-starter/src/app/shared/models/
Services	frontend-starter/src/app/shared/services/
Pages       frontend-starter/src/app/components/

le mécanisme qui ajoute le JWT aux requêtes protégées
auth.interceptor.ts

les routes publiques n'utilisent pas le token (donc les 3 premières)