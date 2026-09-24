import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule, MatPaginatorModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);

  // État de la bibliothèque paginée. La pagination est faite par le serveur :
  // chaque changement de page déclenche un nouvel appel HTTP.
  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly limit = signal(5);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly audioUrl = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.load();
  }

  choose(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0];
    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.list(this.page(), this.limit()).subscribe({
      next: (response) => {
        console.debug(
          `[TracksPage] Page ${response.page}/${response.pages} chargée, ${response.items.length} piste(s) sur ${response.total}`,
        );
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.total.set(response.total);
        // Le serveur borne lui-même la page et la taille demandées : on garde ses valeurs.
        this.page.set(response.page);
        this.limit.set(response.limit);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Chargement impossible', error.status);
        this.error.set(error.error?.message ?? 'Chargement de la bibliothèque impossible');
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    // Garde-fous : pas de page hors bornes, pas de requête pendant un chargement.
    if (this.loading() || page < 1 || page > this.pages() || page === this.page()) return;

    this.page.set(page);
    this.load();
  }

  /**
   * Événement du paginator Material. Son pageIndex commence à 0 alors que l'API
   * numérote les pages à partir de 1, d'où le décalage.
   */
  onPage(event: PageEvent): void {
    if (event.pageSize !== this.limit()) {
      this.limit.set(event.pageSize);
      this.page.set(1);
      this.load();
      return;
    }

    this.go(event.pageIndex + 1);
  }

  upload(): void {
    if (!this.file) return;

    this.service.upload(this.file, this.title.value || this.file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.title.setValue('');
        this.file = undefined;
        this.page.set(1);
        this.load();
      },
      error: (error) => console.error('[TracksPage] Envoi impossible', error),
    });
  }

  play(track: Track): void {
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (error) => console.error('[TracksPage] Lecture impossible', error),
    });
  }
}
