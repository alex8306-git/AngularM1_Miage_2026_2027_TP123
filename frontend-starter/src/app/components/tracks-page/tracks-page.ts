import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule, MatPaginatorModule, DatePipe],
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

  // État de l'envoi.
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  file?: File;

  // État de la lecture.
  readonly audioUrl = signal('');
  readonly playing = signal<Track | null>(null);
  readonly audioError = signal('');

  constructor() {
    this.load();

    // La dernière ObjectURL doit être libérée quand on quitte la page,
    // sinon le fichier audio reste en mémoire jusqu'au rechargement complet.
    inject(DestroyRef).onDestroy(() => this.releaseAudioUrl());
  }

  // --- Bibliothèque ---------------------------------------------------------

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

  // --- Envoi ----------------------------------------------------------------

  choose(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.uploadSuccess.set('');

    if (!file) {
      this.file = undefined;
      this.uploadError.set('');
      return;
    }

    // Contrôle immédiat : inutile d'envoyer 30 Mo pour apprendre que c'est refusé.
    const probleme = this.service.validate(file);
    if (probleme) {
      console.warn('[TracksPage] Fichier refusé avant envoi', file.type, file.size);
      this.file = undefined;
      this.uploadError.set(probleme);
      return;
    }

    this.file = file;
    this.uploadError.set('');
    console.debug('[TracksPage] Fichier sélectionné', file.name);
  }

  upload(): void {
    const file = this.file;
    if (!file || this.uploading()) return;

    // Second contrôle, au cas où le fichier aurait été choisi avant une évolution des règles.
    const probleme = this.service.validate(file);
    if (probleme) {
      this.uploadError.set(probleme);
      return;
    }

    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.uploading.set(true);
    // On désactive par le FormControl, jamais par [disabled] dans le template :
    // c'est la règle des Reactive Forms.
    this.title.disable();

    this.service.upload(file, this.title.value.trim() || file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploading.set(false);
        this.title.enable();
        this.uploadSuccess.set(`« ${track.title} » ajoutée à votre bibliothèque.`);
        this.resetUploadForm();
        this.page.set(1);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Envoi impossible', error.status);
        this.uploading.set(false);
        this.title.enable();
        this.uploadError.set(error.error?.message ?? "Envoi impossible pour l'instant.");
      },
    });
  }

  private resetUploadForm(): void {
    this.title.setValue('');
    this.file = undefined;
    // Vider aussi l'élément, sinon il continue d'afficher le nom du fichier envoyé.
    const input = this.fileInput();
    if (input) input.nativeElement.value = '';
  }

  // --- Lecture --------------------------------------------------------------

  play(track: Track): void {
    this.audioError.set('');

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id, `${blob.size} octets`);
        this.releaseAudioUrl();
        this.audioUrl.set(URL.createObjectURL(blob));
        this.playing.set(track);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Lecture impossible', error.status);
        // La réponse d'erreur est ici un Blob (responseType: 'blob') :
        // son message n'est pas lisible directement, on se fie au statut.
        this.audioError.set(
          error.status === 404
            ? 'Piste introuvable, ou elle ne vous appartient pas.'
            : 'Lecture impossible pour le moment.',
        );
      },
    });
  }

  onAudioError(): void {
    console.error('[TracksPage] Le lecteur audio a rejeté le fichier');
    this.audioError.set('Le navigateur ne parvient pas à lire ce fichier.');
  }

  private releaseAudioUrl(): void {
    const url = this.audioUrl();
    if (!url) return;

    URL.revokeObjectURL(url);
    this.audioUrl.set('');
  }

  // --- Affichage ------------------------------------------------------------

  /** Le backend renvoie une taille en octets : on l'affiche dans une unité lisible. */
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  /** Transforme un type MIME en étiquette courte pour la card. */
  formatType(mimeType: string): string {
    switch (mimeType) {
      case 'audio/mpeg':
        return 'MP3';
      case 'audio/wav':
      case 'audio/x-wav':
        return 'WAV';
      case 'audio/ogg':
        return 'OGG';
      case 'audio/mp4':
      case 'audio/x-m4a':
        return 'M4A';
      default:
        return mimeType;
    }
  }
}
