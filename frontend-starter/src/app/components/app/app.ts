import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Au démarrage, un jeton peut déjà exister dans localStorage : on recharge
    // le profil pour que la navigation et la page profil soient cohérentes.
    this.auth.restoreSession();
  }

  logout(): void {
    console.debug('[AppComponent] Déconnexion demandée');
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
