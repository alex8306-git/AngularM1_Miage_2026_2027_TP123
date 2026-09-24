import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { AppComponent } from './app/components/app/app';
import { routes } from './app/routes';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';
import { errorInterceptor } from './app/shared/interceptors/error.interceptor';
import { frenchPaginatorIntl } from './app/shared/material/paginator-intl';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // authInterceptor ajoute le jeton à l'aller, errorInterceptor traite le 401 au retour.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Angular Material : libellés français du paginator.
    { provide: MatPaginatorIntl, useFactory: frenchPaginatorIntl },
  ],
}).catch(console.error);
