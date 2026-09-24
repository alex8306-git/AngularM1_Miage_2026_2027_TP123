import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);

  readonly error = signal('');
  readonly saved = signal(false);
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  constructor() {
    // Le sujet demande de charger /api/users/me lorsque le profil est demandé :
    // l'appel part donc dès l'arrivée sur la page, sans attendre un clic.
    this.load();
  }

  load(): void {
    this.error.set('');
    this.saved.set(false);

    this.auth.profile().subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
      },
      error: (error: HttpErrorResponse) => {
        console.error('[ProfilePage] Chargement impossible', error.status);
        // Un 401 est déjà traité par errorInterceptor, qui renvoie vers /login.
        this.error.set(error.error?.message ?? 'Chargement du profil impossible');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.saved.set(false);

    this.auth.update(this.form.getRawValue().name).subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil enregistré', user.id);
        this.saved.set(true);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[ProfilePage] Enregistrement impossible', error.status);
        this.error.set(error.error?.message ?? 'Enregistrement impossible');
      },
    });
  }
}
