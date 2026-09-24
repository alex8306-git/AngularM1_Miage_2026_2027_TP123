import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Sends the user back to the login page when the API rejects the token. */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Un 401 sur /api/auth/* est un échec de connexion normal : la page de
      // connexion affiche elle-même le message. Ailleurs, le jeton est absent,
      // invalide ou expiré : on nettoie l'état local et on retourne au login.
      if (error.status === 401 && !request.url.startsWith('/api/auth/')) {
        console.warn('[errorInterceptor] Session invalide ou expirée, retour vers /login');
        auth.logout();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
